function render_profile() {
    return `<div class="dashboard-body">
                <div class="page-header">
                    <h1>My Profile</h1>
                    <button type="button" class="primary-btn" id="profile-save-btn"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
                    <!-- Left Column: Personal Info -->
                    <div class="data-card">
                        <div class="card-header">
                            <h2>Personal Information</h2>
                        </div>
                        <div style="padding: 24px;">
                            <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 32px;">
                                <img id="profile-avatar-img" src="https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff&size=100" alt="Avatar" style="border-radius: 50%; width: 100px; height: 100px;">
                                <div>
                                    <h3 id="profile-user-name" style="font-size: 1.5rem; margin: 0 0 8px 0; color: var(--text-dark);">Admin User</h3>
                                    <span id="profile-user-role" class="status manager" style="padding: 4px 12px; font-size: 0.85rem;">Manager</span>
                                    <div style="margin-top: 12px;">
                                        <button type="button" id="profile-upload-avatar-btn" class="outline-btn" style="font-size: 0.85rem; padding: 6px 12px;"><i class="fa-solid fa-upload"></i> Upload new photo</button>
                                    </div>
                                </div>
                            </div>
 
                            <form id="profile-info-form">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                                   <div class="form-group" style="grid-column: span 2;">
                                       <label class="form-label">Name</label>
                                       <input type="text" id="name" class="form-input" value="Admin User" placeholder=" ">
                                   </div>
                                   <div class="form-group">
                                       <label class="form-label">Email Address</label>
                                       <input type="email" id="email" class="form-input" value="admin@advretail.com" placeholder=" " readonly>
                                   </div>
                                   <div class="form-group">
                                       <label class="form-label">Phone Number</label>
                                       <input type="tel" id="phone" class="form-input" value="+60 12-345 6789" placeholder=" ">
                                   </div>
                                </div>
                                <div class="form-group" style="margin-bottom: 24px;">
                                    <label class="form-label">Address</label>
                                    <textarea id="address" class="form-input" placeholder=" " style="resize: vertical; min-height: 80px; padding-top: 12px;">123 Commerce Blvd, Suite 400</textarea>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                                    <div class="form-group">
                                        <label class="form-label">Postcode</label>
                                        <input type="text" id="postcode" class="form-input" value="50000" placeholder=" ">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">State</label>
                                        <select id="state" class="select2-search" data-placeholder="State" style="width: 100%;">
                                            <option></option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Right Column: Security & Preferences -->
                    <div style="display: flex; flex-direction: column; gap: 24px;">
                        <!-- Security -->
                        <div class="data-card">
                            <div class="card-header">
                                <h2>Security</h2>
                            </div>
                            <div style="padding: 24px;">
                                <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0 0 20px 0;">Ensure your account is using a long, random password to stay secure.</p>
                                <form id="profile-password-form">
                                    <div class="form-group" style="margin-bottom: 24px; position: relative;">
                                        <label class="form-label">New Password</label>
                                        <input type="password" id="new-password" class="form-input" placeholder=" " style="padding-right: 40px; width: 100%;">
                                        <button type="button" class="toggle-password" data-target="new-password" style="position: absolute; right: 12px; top: 12px; background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0;">
                                            <i class="fa-regular fa-eye-slash"></i>
                                        </button>
                                    </div>
                                    <div class="form-group" style="margin-bottom: 24px; position: relative;">
                                        <label class="form-label">Confirm Password</label>
                                        <input type="password" id="confirm-password" class="form-input" placeholder=" " style="padding-right: 40px; width: 100%;">
                                        <button type="button" class="toggle-password" data-target="confirm-password" style="position: absolute; right: 12px; top: 12px; background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0;">
                                            <i class="fa-regular fa-eye-slash"></i>
                                        </button>
                                    </div>
                                    <button type="button" id="profile-update-password-btn" class="outline-btn full-width">Update Password</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <input type="file" id="profile-avatar-input" accept="image/*" style="display:none;">
             
    `;
}

window.init_profile = async function() {
    if (typeof window.initializeSelect2 === 'function') {
        window.initializeSelect2();
    }
    await loadProfilePage();
};

async function loadProfilePage() {
    const [states, profile] = await Promise.all([
        fetchProfileStates(),
        loadCurrentProfile()
    ]);

    populateStateSelect(states);

    if (typeof window.initializeSelect2 === 'function') {
        window.initializeSelect2();
    }

    if (profile) {
        populateProfileForm(profile);
        await refreshProfileHeader();
    }

    attachProfilePageListeners();
}

async function fetchProfileStates() {
    const { data, error } = await window.supabaseClient
        .from('state')
        .select('id, name')
        .order('name');

    if (error) {
        console.warn('Failed to load states for profile page:', error.message || error);
        return [];
    }

    return data || [];
}

function populateStateSelect(states) {
    const stateSelect = document.getElementById('state');
    if (!stateSelect) return;
    stateSelect.innerHTML = '<option></option>' + (states || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

async function loadCurrentProfile() {
    const contactId = await window.getCurrentContactId();
    if (!contactId) {
        return null;
    }

    const { data, error } = await window.supabaseClient
        .from('contact')
        .select('id, name, email, mobile, address, postcode, avatar, state(id, name)')
        .eq('id', contactId)
        .maybeSingle();

    if (error) {
        console.error('Unable to load profile data:', error);
        return null;
    }

    return data;
}

function populateProfileForm(profile) {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressText = document.getElementById('address');
    const postcodeInput = document.getElementById('postcode');
    const stateSelect = document.getElementById('state');
    const avatarImg = document.getElementById('profile-avatar-img');
    const nameLabel = document.getElementById('profile-user-name');

    if (nameInput) nameInput.value = profile.name || '';
    if (emailInput) emailInput.value = profile.email || '';
    if (phoneInput) phoneInput.value = profile.mobile || profile.phone || '';
    if (addressText) addressText.value = profile.address || '';
    if (postcodeInput) postcodeInput.value = profile.postcode || '';
    if (stateSelect) {
        stateSelect.value = (profile.state && profile.state.id) || '';
        if (typeof jQuery !== 'undefined') {
            $(stateSelect).trigger('change');
        }
    }
    if (avatarImg && profile.avatar) {
        avatarImg.src = profile.avatar;
    }
    if (nameLabel) {
        nameLabel.textContent = profile.name || 'My Profile';
    }
}

async function refreshProfileHeader() {
    if (!window.currentUserProfile) {
        await window.getUserStores();
    }

    const activeStoreId = await window.getActiveStoreId();
    const profile = window.currentUserProfile;
    if (!profile) return;

    const roleLabel = document.getElementById('profile-user-role');
    if (roleLabel) {
        const currentRole = profile.roles.find(r => String(r.storeId) === activeStoreId);
        const roleText = currentRole ? currentRole.roleName : 'Staff';
        const displayRole = roleText.charAt(0).toUpperCase() + roleText.slice(1);
        roleLabel.textContent = displayRole;
        const normalizedRole = roleText.toLowerCase().replace(/\s+/g, '-');
        roleLabel.className = `status ${normalizedRole}`;
    }

    if (typeof window.populateUserProfileHeader === 'function') {
        await window.populateUserProfileHeader();
    }
}

function attachProfilePageListeners() {
    const profileForm = document.getElementById('profile-info-form');
    if (profileForm) {
        profileForm.addEventListener('submit', e => e.preventDefault());
    }

    const passwordForm = document.getElementById('profile-password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', e => e.preventDefault());
    }

    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const target = document.getElementById(targetId);
            if (!target) return;
            if (target.type === 'password') {
                target.type = 'text';
                button.innerHTML = '<i class="fa-regular fa-eye"></i>';
            } else {
                target.type = 'password';
                button.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
            }
        });
    });

    const saveButton = document.getElementById('profile-save-btn');
    if (saveButton) {
        saveButton.addEventListener('click', handleSaveProfile);
    }

    const passwordButton = document.getElementById('profile-update-password-btn');
    if (passwordButton) {
        passwordButton.addEventListener('click', handleUpdatePassword);
    }

    const uploadButton = document.getElementById('profile-upload-avatar-btn');
    const fileInput = document.getElementById('profile-avatar-input');
    if (uploadButton && fileInput) {
        uploadButton.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file for your avatar.');
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const avatarImg = document.getElementById('profile-avatar-img');
                if (avatarImg) {
                    avatarImg.src = reader.result;
                }
            };
            reader.readAsDataURL(file);
        });
    }
}

async function handleSaveProfile() {
    const saveButton = document.getElementById('profile-save-btn');
    if (!saveButton) return;

    const originalText = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
        const contactId = await window.getCurrentContactId();
        if (!contactId) {
            throw new Error('Unable to determine current profile.');
        }

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const addressInput = document.getElementById('address');
        const postcodeInput = document.getElementById('postcode');
        const stateSelect = document.getElementById('state');

        const name = (nameInput && nameInput.value.trim()) || '';
        const email = (emailInput && emailInput.value.trim()) || '';
        const phone = (phoneInput && phoneInput.value.trim()) || '';
        const address = (addressInput && addressInput.value.trim()) || '';
        const postcode = (postcodeInput && postcodeInput.value.trim()) || '';
        const stateId = stateSelect ? stateSelect.value || null : null;

        if (!name) {
            throw new Error('Please enter your name.');
        }

        if (!email || !email.includes('@')) {
            throw new Error('Please enter a valid email address.');
        }

        const updatePayload = {
            name,
            mobile: phone,
            address,
            postcode,
            state: stateId || null
        };

        const { error: contactError } = await window.supabaseClient
            .from('contact')
            .update(updatePayload)
            .eq('id', contactId);

        if (contactError) {
            throw new Error(contactError.message || 'Unable to update profile information.');
        }

        window.currentUserProfile = null;
        await window.getUserStores();
        await refreshProfileHeader();

        alert('Profile updated successfully.');
    } catch (error) {
        console.error('Profile save failed:', error);
        alert(error.message || 'Failed to save profile changes.');
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = originalText;
    }
}

async function handleUpdatePassword() {
    const button = document.getElementById('profile-update-password-btn');
    if (!button) return;

    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

    try {
        const newPasswordInput = document.getElementById('new-password');
        const confirmPasswordInput = document.getElementById('confirm-password');

        const newPassword = (newPasswordInput && newPasswordInput.value) || '';
        const confirmPassword = (confirmPasswordInput && confirmPasswordInput.value) || '';

        if (!newPassword) {
            throw new Error('Please enter a new password.');
        }
        if (newPassword.length < 6) {
            throw new Error('Password should be at least 6 characters.');
        }
        if (newPassword !== confirmPassword) {
            throw new Error('New password and confirmation do not match.');
        }

        const { error } = await window.supabaseClient.auth.updateUser({ password: newPassword });
        if (error) {
            throw new Error(error.message || 'Unable to update password.');
        }

        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';

        alert('Password updated successfully.');
    } catch (error) {
        console.error('Password update failed:', error);
        alert(error.message || 'Failed to update password.');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}
