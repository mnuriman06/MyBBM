// auth.js — login gate, session state, logout

const ALLOWED_LOGIN_ROLES = ['admin', 'manager', 'cashier'];

async function postAuthGate() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return false;

    // Link this auth user to their pre-existing contact row, if not linked yet.
    // Fails silently (harmlessly) if already linked or no matching contact — RLS handles both.
    await window.supabaseClient
        .from('contact')
        .update({ user_id: user.id })
        .eq('email', user.email.toLowerCase())
        .is('user_id', null);

    const { data: contact } = await window.supabaseClient
        .from('contact')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!contact) {
        await rejectLogin('No matching account found. Contact an admin to be added.');
        return false;
    }

    const { data: assignments } = await window.supabaseClient
        .from('store_contact')
        .select('role(name)')
        .eq('contact', contact.id);

    const canLogin = assignments?.some(a => ALLOWED_LOGIN_ROLES.includes(a.role?.name.toLowerCase()));

    if (!canLogin) {
        await rejectLogin('Your account does not have app access.');
        return false;
    }

    localStorage.setItem('current_contact_name', contact.name);
    return true;
}

async function rejectLogin(message) {
    await window.supabaseClient.auth.signOut();
    const errorMsgBox = document.getElementById('login-error-msg');
    const errorText = document.getElementById('login-error-text');
    if (errorMsgBox && errorText) {
        errorText.textContent = message;
        errorMsgBox.style.display = 'flex';
    } else {
        alert(message);
    }
}


// Route guard: call at top of router() for any non-login route
async function requireSession() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        navigateTo('login');
        return false;
    }
    return true;
}

// React to session changes anywhere in the app (covers OAuth redirect return too)
window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
        const ok = await postAuthGate();
        if (ok && appState.currentRoute === 'login') {
            navigateTo('dashboard');
        }
    }
    if (event === 'PASSWORD_RECOVERY') {
        openSetNewPasswordModalWhenReady();
    }
    if (event === 'SIGNED_OUT') {
        localStorage.removeItem('current_contact_name');
        localStorage.removeItem('active_store_id');
        localStorage.removeItem('view_store_id');
        window.currentContactId = null; // add this
        window.currentUserProfile = null; // good idea to clear this too, same reasoning
        navigateTo('login');
    }
});

function openSetNewPasswordModalWhenReady(attempts = 0) {
    const modal = document.getElementById('set-new-password-modal');
    if (modal) {
        modal.classList.add('active');
        return;
    }
    if (attempts < 20) {
        setTimeout(() => openSetNewPasswordModalWhenReady(attempts + 1), 100);
    }
}

window.currentContactId = null;

async function getCurrentContactId() {
    if (window.currentContactId) return window.currentContactId;

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return null;

    const { data, error } = await window.supabaseClient
        .from('contact')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error || !data) return null;

    window.currentContactId = data.id;
    return window.currentContactId;
}

// Cache the profile globally so other scripts (like topbar) can use it without re-fetching
window.currentUserProfile = null; 

async function getUserStores() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return [];

    // Fetch the contact linked to this auth user, including their roles and linked stores
    const { data, error } = await window.supabaseClient
        .from('contact')
        .select(`
            id,
            name,
            avatar,
            store_contact (
                role ( name ),
                store ( id, name, url, email, tel, address, logo )
            )
        `)
        .eq('user_id', user.id)
        .single();

    if (error || !data) {
        console.error('Error fetching user stores:', error);
        return [];
    }

    // Populate the global profile cache
    window.currentUserProfile = {
        id: data.id,
        name: data.name,
        avatar: data.avatar,
        roles: data.store_contact.map(sc => ({
            storeId: sc.store.id,
            roleName: sc.role.name
        }))
    };

    // Return just the array of store objects
    return data.store_contact.map(sc => sc.store);
}

async function getActiveStoreId() {
    const stores = await window.getUserStores();
    if (!stores.length) return null;

    let activeId = localStorage.getItem('active_store_id');
    
    // Validate if the stored ID is actually one the user has access to
    const hasAccess = stores.find(s => String(s.id) === activeId);
    
    if (!activeId || !hasAccess) {
        // Default to their first available store
        activeId = String(stores[0].id);
        localStorage.setItem('active_store_id', activeId);
    }
    
    return activeId;
}