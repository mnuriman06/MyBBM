// --- Global datetime helpers (canonical format: YYYY-MM-DD HH:MM:SS) ---
function formatDateTime(input) {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return '-';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
window.formatDateTime = formatDateTime;

// Date-only companion to formatDateTime — YYYY-MM-DD, no time component
function formatDateOnly(input) {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return '-';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
window.formatDateOnly = formatDateOnly;

// <input type="datetime-local" step="1"> gives 'YYYY-MM-DDTHH:MM:SS' — convert to our canonical string
function fromDatetimeLocalInput(value) {
    if (!value) return formatDateTime(new Date());
    return value.replace('T', ' ');
}
window.fromDatetimeLocalInput = fromDatetimeLocalInput;

// Reverse: canonical string -> value a datetime-local input expects
function toDatetimeLocalInput(value) {
    if (!value) return '';
    return String(value).replace(' ', 'T');
}
window.toDatetimeLocalInput = toDatetimeLocalInput;

// --- Shared trans_no generator: {iso}-{year}-{seq}. Lives here (not in transaction.js)
// so any page — POS included — can call it regardless of script load order. ---
async function generateTransNo(type, forDate, storeUrl) {
    const iso = type.iso;
    const urlPart = (storeUrl || 'STORE').toString().trim();
    const year = new Date(forDate).getFullYear();
    const prefix = `${iso}-${urlPart}-${year}-`;

    const { data } = await window.supabaseClient
        .from('trans')
        .select('trans_no')
        .ilike('trans_no', `${prefix}%`)
        .order('trans_no', { ascending: false })
        .limit(1);

    let nextSeq = 1;
    if (data && data.length && data[0].trans_no) {
        const match = data[0].trans_no.match(/(\d+)$/);
        if (match) nextSeq = parseInt(match[1], 10) + 1;
    }
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}
window.generateTransNo = generateTransNo;

// --- Stock movement: applies or reverses store_product qty per trans_type.ope_qty ---
// direction: 1 = apply, -1 = reverse. items: [{ store_product, qty_order }, ...]
async function applyStockMovement(transType, items, direction = 1) {
    if (!transType || !transType.ope_qty || !items || !items.length) return;

    const sign = transType.ope_qty.trim() === '+' ? 1 : -1;
    const effectiveSign = sign * direction;

    for (const item of items) {
        if (!item.store_product || !item.qty_order) continue;
        if (item.stock_control === 1) continue; // Infinite — never mutate stock

        const { data: sp, error: fetchErr } = await window.supabaseClient
            .from('store_product')
            .select('qty_in, qty_out, qty_bal')
            .eq('id', item.store_product)
            .maybeSingle();

        if (fetchErr || !sp) continue;

        const qty = Number(item.qty_order) || 0;
        const qtyIn = Number(sp.qty_in) || 0;
        const qtyOut = Number(sp.qty_out) || 0;
        const qtyBal = Number(sp.qty_bal) || 0;

        const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
        const update = effectiveSign > 0
        ? { qty_in: round2(qtyIn + qty), qty_bal: round2(qtyBal + qty) }
        : { qty_out: round2(qtyOut + qty), qty_bal: round2(qtyBal - qty) };

        await window.supabaseClient.from('store_product').update(update).eq('id', item.store_product);
    }
}
window.applyStockMovement = applyStockMovement;

// --- BNM Cash Rounding Mechanism ---
// Applies to the grand total of a bill only (never individual items).
// Totals ending in 1,2,6,7 sen round DOWN to nearest 5 sen; 3,4,8,9 sen round UP.
// Totals ending in 0 or 5 sen are unaffected.
// Returns { rounded, rounding } where rounding = rounded - amount (can be +/-).
// --- BNM Cash Rounding Mechanism ---
// Applies to the grand total of a bill only (never individual items).
// Sen ending 1,2 -> round down to nearest 0; 3,4 -> round up to nearest 5;
// 6,7 -> round down to nearest 5; 8,9 -> round up to nearest 10. 0,5 unchanged.
// Returns { rounded, rounding } where rounding = rounded - amount (can be +/-).
function computeBnmRounding(amount) {
    const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
    const amt = round2(Number(amount) || 0);

    const totalSen = Math.round(amt * 100);
    const lastDigit = ((totalSen % 10) + 10) % 10; // guard negative totals

    let roundedSen;
    switch (lastDigit) {
        case 0:
        case 5:
            roundedSen = totalSen;
            break;
        case 1:
        case 2:
            roundedSen = totalSen - lastDigit; // down to nearest 0
            break;
        case 3:
        case 4:
            roundedSen = totalSen + (5 - lastDigit); // up to nearest 5
            break;
        case 6:
        case 7:
            roundedSen = totalSen - (lastDigit - 5); // down to nearest 5
            break;
        default: // 8, 9
            roundedSen = totalSen + (10 - lastDigit); // up to nearest 10
            break;
    }

    const rounded = round2(roundedSen / 100);
    const rounding = round2(rounded - amt);
    return { rounded, rounding };
}
window.computeBnmRounding = computeBnmRounding;