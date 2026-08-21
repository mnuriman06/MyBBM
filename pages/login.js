function render_login() {
    return `
    <div class="auth-body">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <div class="logo" style="justify-content: center;">
                        <i class="fa-solid fa-shop"></i>
                        <span>ADVRetail</span>
                    </div>
                    <h2>Welcome back</h2>
                    <p>Please enter your details to sign in.</p>
                </div>

                <form class="auth-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" placeholder="Enter your email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <div style="position: relative; width: 100%; display: flex; align-items: center;">
                            <input type="password" id="password" placeholder="Enter your password" required
                                style="padding-right: 40px; width: 100%; margin-bottom: 0;">
                            <button type="button" id="toggle-password"
                                style="position: absolute; right: 12px; top: 0; bottom: 0; background: none; border: none; outline: none; box-shadow: none; cursor: pointer; color: var(--text-muted); padding: 0; margin: 0; display: flex; align-items: center; justify-content: center;">
                                <i class="fa-regular fa-eye-slash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-options">
                        <label class="remember-me"></label>
                        <a href="#" id="forgot-password-link" class="forgot-password">Forgot password?</a>
                    </div>
                    <button type="submit" class="primary-btn full-width">Sign In</button>
                    <div id="login-error-msg" style="display: none; margin-top: 12px; padding: 10px; border-radius: var(--radius-sm); background-color: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); color: var(--danger); font-size: 0.85rem; text-align: center; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <span id="login-error-text"></span>
                    </div>
                </form>

                <div class="auth-divider">
                    <span>Or continue with</span>
                </div>

                <div class="social-login" style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                    <button type="button" class="google-btn" style="width: 100%; height: 48px; font-size: 0.85rem;">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google">
                        Sign in with Google
                    </button>
                </div>
                <div style="margin-top: 16px; text-align: center; font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <span style="display: inline-block; width: 6px; height: 6px; background-color: var(--success); border-radius: 50%;"></span>
                    <span>Database: <strong>ADVRetail</strong></span>
                </div>
            </div>
        </div>

        <!-- Forgot Password Modal -->
        <div id="forgot-password-modal" class="modal-overlay">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2 style="margin: 0; font-size: 1.25rem;">Reset password</h2>
                    <button type="button" class="close-modal-btn" id="close-forgot-password-btn"
                        style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted);"><i
                            class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <p style="margin: 0 0 20px 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.5;">Enter your
                        email and we'll send you instructions to reset your password.</p>
                    <form id="forgot-password-form">
                        <div class="form-group">
                            <label for="reset-email">Email</label>
                            <input type="email" id="reset-email" placeholder="Enter your email address" required
                                style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                    </form>
                    <div id="forgot-password-error-msg" style="display: none; margin-top: 12px; padding: 10px; border-radius: var(--radius-sm); background-color: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); color: var(--danger); font-size: 0.85rem; text-align: center; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <span id="forgot-password-error-text"></span>
                    </div>
                    <div id="forgot-password-success-msg" style="display: none; margin-top: 12px; padding: 10px; border-radius: var(--radius-sm); background-color: var(--success-bg); border: 1px solid var(--success); color: var(--success); font-size: 0.85rem; text-align: center; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fa-solid fa-circle-check"></i>
                        <span id="forgot-password-success-text"></span>
                    </div>
                </div>
                <div class="modal-footer"
                    style="padding: 16px 24px; border-top: 1px solid var(--border-color); display: flex; justify-content: center;">
                    <button type="submit" form="forgot-password-form" class="primary-btn" style="width: 100%; text-align: center;">Send Reset Link</button>
                </div>
            </div>
        </div>

        <!-- Set New Password Modal — opened automatically after clicking the reset link in email -->
        <div id="set-new-password-modal" class="modal-overlay">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2 style="margin: 0; font-size: 1.25rem;">Set a new password</h2>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <p style="margin: 0 0 20px 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.5;">Enter a new password for your account.</p>
                    <form id="set-new-password-form">
                        <div class="form-group">
                            <label for="new-password-field">New Password</label>
                            <input type="password" id="new-password-field" placeholder="Enter new password" required minlength="6"
                                style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 12px;">
                        </div>
                        <div class="form-group">
                            <label for="confirm-password-field">Confirm Password</label>
                            <input type="password" id="confirm-password-field" placeholder="Re-enter new password" required minlength="6"
                                style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        </div>
                    </form>
                    <div id="new-password-error-msg" style="display: none; margin-top: 12px; padding: 10px; border-radius: var(--radius-sm); background-color: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); color: var(--danger); font-size: 0.85rem; text-align: center; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <span id="new-password-error-text"></span>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px;">
                    <button type="submit" form="set-new-password-form" class="primary-btn full-width">Update Password</button>
                    <button type="button" id="cancel-recovery-btn" class="outline-btn full-width" style="border: none; color: var(--text-muted);">Cancel and sign out</button>
                </div>
            </div>
        </div>
    </div>
    `;
}

window.init_login = function() {
    const googleBtn = document.querySelector('.google-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const originalContent = googleBtn.innerHTML;
            googleBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting to Google...';
            const { error } = await window.supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            });
            if (error) {
                googleBtn.innerHTML = originalContent;
                alert('Google sign-in failed: ' + error.message);
            }
        });
    }

    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePasswordBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
            } else {
                passwordInput.type = 'password';
                togglePasswordBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
            }
        });
    }

    const forgotLink = document.getElementById('forgot-password-link');
    const forgotModal = document.getElementById('forgot-password-modal');
    const closeForgotBtn = document.getElementById('close-forgot-password-btn');
    if (forgotLink && forgotModal) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotModal.classList.add('active');
        });
    }
    if (closeForgotBtn && forgotModal) {
        closeForgotBtn.addEventListener('click', () => {
            forgotModal.classList.remove('active');
        });
    }

    // ===== Forgot Password: send reset link =====
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const forgotErrorBox = document.getElementById('forgot-password-error-msg');
    const forgotErrorText = document.getElementById('forgot-password-error-text');
    const forgotSuccessBox = document.getElementById('forgot-password-success-msg');
    const forgotSuccessText = document.getElementById('forgot-password-success-text');

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (forgotErrorBox) forgotErrorBox.style.display = 'none';
            if (forgotSuccessBox) forgotSuccessBox.style.display = 'none';

            const email = document.getElementById('reset-email').value.trim();
            const submitBtn = document.querySelector('button[form="forgot-password-form"]');
            const originalBtnHtml = submitBtn.innerHTML;

            if (email.length < 5 || !email.includes('@')) {
                showForgotError('Please enter a valid email address.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

            const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + window.location.pathname
            });

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;

            if (error) {
                showForgotError('Something went wrong. Please try again shortly.');
                return;
            }

            // Always show success, whether or not the email matches an account —
            // this avoids leaking which emails exist in the system.
            if (forgotSuccessBox && forgotSuccessText) {
                forgotSuccessText.textContent = 'If that email is registered, a reset link has been sent.';
                forgotSuccessBox.style.display = 'flex';
            }
            forgotPasswordForm.reset();

            function showForgotError(msg) {
                if (forgotErrorBox && forgotErrorText) {
                    forgotErrorText.textContent = msg;
                    forgotErrorBox.style.display = 'flex';
                } else {
                    alert(msg);
                }
            }
        });
    }

    // ===== Set New Password: shown after clicking the emailed reset link =====
    const setNewPasswordForm = document.getElementById('set-new-password-form');
    const newPwErrorBox = document.getElementById('new-password-error-msg');
    const newPwErrorText = document.getElementById('new-password-error-text');
    const cancelRecoveryBtn = document.getElementById('cancel-recovery-btn');

    if (setNewPasswordForm) {
        setNewPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (newPwErrorBox) newPwErrorBox.style.display = 'none';

            const newPassword = document.getElementById('new-password-field').value;
            const confirmPassword = document.getElementById('confirm-password-field').value;
            const submitBtn = document.querySelector('button[form="set-new-password-form"]');
            const originalBtnHtml = submitBtn.innerHTML;

            if (newPassword.length < 6) {
                showNewPwError('Password must be at least 6 characters.');
                return;
            }
            if (newPassword !== confirmPassword) {
                showNewPwError('Passwords do not match.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

            const { error } = await window.supabaseClient.auth.updateUser({ password: newPassword });

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;

            if (error) {
                showNewPwError('Could not update password. Please try the reset link again.');
                return;
            }

            document.getElementById('set-new-password-modal')?.classList.remove('active');
            setNewPasswordForm.reset();

            // A fresh, real session now exists — proceed through the normal gate.
            const ok = await postAuthGate();
            if (ok) navigateTo('dashboard');

            function showNewPwError(msg) {
                if (newPwErrorBox && newPwErrorText) {
                    newPwErrorText.textContent = msg;
                    newPwErrorBox.style.display = 'flex';
                } else {
                    alert(msg);
                }
            }
        });
    }

    if (cancelRecoveryBtn) {
        cancelRecoveryBtn.addEventListener('click', async () => {
            await window.supabaseClient.auth.signOut();
            document.getElementById('set-new-password-modal')?.classList.remove('active');
        });
    }

    // ===== Main Sign-In Form =====
    const authForm = document.getElementById('login-form') || document.querySelector('.auth-form');
    const loginErrorBox = document.getElementById('login-error-msg');
    const loginErrorText = document.getElementById('login-error-text');

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (loginErrorBox) loginErrorBox.style.display = 'none';

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const submitBtn = authForm.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn.innerHTML;

            if (email.length < 5 || !email.includes('@')) {
                showLoginError('Please enter a valid email address.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';

            const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });

            if (error) {
                showLoginError('Invalid email or password. Maybe you signed in with Google?');
                resetBtn();
                return;
            }

            const ok = await postAuthGate();
            resetBtn();
            if (ok) navigateTo('dashboard');

            function showLoginError(msg) {
                if (loginErrorBox && loginErrorText) {
                    loginErrorText.textContent = msg;
                    loginErrorBox.style.display = 'flex';
                } else {
                    alert(msg);
                }
            }
            function resetBtn() {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
        });
    }
};