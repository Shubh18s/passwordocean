// --- Configuration ---
const PBKDF2_ITERATIONS = 600000;
const DERIVED_KEY_LENGTH = 32;
const FINAL_PASSWORD_LENGTH = 24;

const API_GATEWAY_URL = 'https://981znzmtrh.execute-api.ap-southeast-2.amazonaws.com/v1/clicks';

// Ensure DOM is fully loaded before accessing elements
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded: Initializing PasswordOcean script.');

    // Moved these declarations inside DOMContentLoaded
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const mobileNavLinks = document.getElementById('mobileNavLinks');
    const mainHeader = document.getElementById('mainHeader');

    console.log('hamburgerMenu element:', hamburgerMenu);
    console.log('mobileNavLinks element:', mobileNavLinks);
    console.log('mainHeader element:', mainHeader);

    const masterPassphraseInput = document.getElementById('masterPassphrase');
    const serviceNameInput = document.getElementById('serviceName');
    const generateButton = document.getElementById('generateButton');
    const generatedPasswordSpan = document.getElementById('generatedPassword');
    const passwordDisplayContainer = document.getElementById('passwordDisplayContainer');
    const copyButton = document.getElementById('copyButton');
    const messageBox = document.getElementById('messageBox');
    const emailTrapInput = document.getElementById('email_trap'); // Get the honeypot field

    // Toggle buttons and content divs
    const toggleDetailedHowItWorksButton = document.getElementById('toggleDetailedHowItWorks');
    const detailedHowItWorksContent = document.getElementById('detailedHowItWorksContent');

    // Password visibility toggle elements
    const togglePasswordVisibilityButton = document.getElementById('togglePasswordVisibility');
    const eyeOpenIcon = document.getElementById('eyeOpen');
    const eyeClosedIcon = document.getElementById('eyeClosed');


    /**
     * Toggles the visibility of an element and rotates the SVG icon.
     * @param {HTMLElement} contentElement - The element whose visibility to toggle.
     * @param {HTMLElement} buttonElement - The button element containing the SVG icon.
     */
    function toggleVisibility(contentElement, buttonElement) {
        contentElement.classList.toggle('hidden');
        // Remove the expanded class if content is hidden, add if shown
        if (contentElement.classList.contains('hidden')) {
            buttonElement.classList.remove('expanded');
        } else {
            buttonElement.classList.add('expanded');
        }
    }

    // Event listener for the "How It Works" toggle button
    if (toggleDetailedHowItWorksButton) {
        toggleDetailedHowItWorksButton.addEventListener('click', () => toggleVisibility(detailedHowItWorksContent, toggleDetailedHowItWorksButton));
    }

    // Event listener for password visibility toggle
    if (togglePasswordVisibilityButton) {
        togglePasswordVisibilityButton.addEventListener('click', () => {
            const isPassword = masterPassphraseInput.type === 'password';
            masterPassphraseInput.type = isPassword ? 'text' : 'password';
            eyeOpenIcon.classList.toggle('hidden', !isPassword);
            eyeClosedIcon.classList.toggle('hidden', isPassword);
        });
    }

    // Event listener for hamburger menu
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', () => { 
            mainHeader.classList.toggle('expanded'); // Add/remove expanded class to header for styling
        });
    }

    // Close mobile menu if a link is clicked
    if (mobileNavLinks) {
        mobileNavLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNavLinks.classList.add('hidden'); // This will hide the menu when a link is clicked
                mainHeader.classList.remove('expanded'); // And remove the expanded state from the header
            });
        });
    }


    function showMessage(message, type = 'info') {
        messageBox.textContent = message;
        messageBox.classList.remove('bg-red-100', 'text-red-800', 'border-red-400',
                                   'bg-green-100', 'text-green-800', 'border-green-400',
                                   'bg-blue-100', 'text-blue-800', 'border-blue-400');
        messageBox.className = 'message-box show';

        if (type === 'error') {
            messageBox.classList.add('bg-red-100', 'text-red-800', 'border-red-400');
        } else if (type === 'success') {
            messageBox.classList.add('bg-green-100', 'text-green-800', 'border-green-400');
        } else {
            messageBox.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-400');
        }
        setTimeout(() => {
            messageBox.classList.remove('show');
        }, 5000);
    }

    function strToArrayBuffer(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str).buffer;
    }

    function arrayBufferToBase64Url(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    async function generateDeterministicPassword(master_passphrase, service_name) {
        if (!master_passphrase || !service_name) {
            return null; // Indicate failure
        }

        try {
            const passphrase_buffer = strToArrayBuffer(master_passphrase);
            const service_name_buffer = strToArrayBuffer(service_name);

            const key = await crypto.subtle.importKey(
                'raw',
                passphrase_buffer,
                { name: 'PBKDF2' },
                false,
                ['deriveBits']
            );

            const pbkdf2_params = {
                name: 'PBKDF2',
                salt: service_name_buffer,
                iterations: PBKDF2_ITERATIONS,
                hash: 'SHA-256'
            };

            const derived_bits = await crypto.subtle.deriveBits(
                pbkdf2_params,
                key,
                DERIVED_KEY_LENGTH * 8
            );

            const password_raw = arrayBufferToBase64Url(derived_bits);
            const final_password = password_raw.substring(0, FINAL_PASSWORD_LENGTH);

            return final_password;

        } catch (error) {
            console.error("Error generating password:", error);
            return null;
        }
    }

    // Function to send a click event
    async function sendClickEvent() {
        // Check the honeypot field before sending the event
        if (emailTrapInput && emailTrapInput.value) { // Check if emailTrapInput exists and has a value
            console.warn('Honeypot field filled. Likely a bot. Not sending click event.');
            return; // Do not send the event
        }

        try {
            await fetch(API_GATEWAY_URL, {
                method: 'POST',
                mode: 'cors', // Ensure CORS is enabled
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // Can send any non-sensitive data here if needed,
                    // e.g., 'event_type': 'generate_password_click'
                    // For a simple counter, an empty body is fine.
                }),
            });
            console.log('Click event sent to Lambda.');
        } catch (error) {
            console.error('Failed to send click event to Lambda:', error);
        }
    }

    if (generateButton) {
        generateButton.addEventListener('click', async () => {
            generateButton.disabled = true;
            generateButton.textContent = 'Generating...';
            generatedPasswordSpan.textContent = '';
            passwordDisplayContainer.classList.add('hidden');

            const master_passphrase = masterPassphraseInput.value;
            const service_name = serviceNameInput.value.trim();

            const generated_password = await generateDeterministicPassword(master_passphrase, service_name);

            if (generated_password !== null) {
                generatedPasswordSpan.textContent = generated_password;
                passwordDisplayContainer.classList.remove('hidden');
                showMessage("Password generated successfully!", 'success');
                // Send click event AFTER successful password generation and honeypot check
                sendClickEvent();
            } else {
                showMessage("Password generation failed. Please ensure both passphrase and service name are entered.", 'error');
            }

            generateButton.disabled = false;
            generateButton.textContent = 'Generate Password';
        });
    }

    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const password_to_copy = generatedPasswordSpan.textContent;
            if (password_to_copy) {
                const temp_input = document.createElement('textarea');
                temp_input.value = password_to_copy;
                document.body.appendChild(temp_input);
                temp_input.select();
                try {
                    document.execCommand('copy');
                    showMessage("Password copied to clipboard!", 'success');
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    showMessage("Failed to copy password. Please copy manually.", 'error');
                }
                document.body.removeChild(temp_input);
            }
        });
    }

    if (masterPassphraseInput) {
        masterPassphraseInput.addEventListener('input', () => {
            messageBox.classList.remove('show');
            passwordDisplayContainer.classList.add('hidden');
        });
    }
    if (serviceNameInput) {
        serviceNameInput.addEventListener('input', () => {
            messageBox.classList.remove('show');
            passwordDisplayContainer.classList.add('hidden');
        });
    }
});
