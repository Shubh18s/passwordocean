### How the Password Generation Works

The ZenPass password generation relies on a cryptographic function called **PBKDF2 (Password-Based Key Derivation Function 2)** combined with **HMAC-SHA256**. Here's the step-by-step process:

1.  **Inputs:**
    * **Master Passphrase:** This is your secret, strong passphrase that you remember.
    * **Service Name:** This is the unique name you assign to each service (e.g., "Google", "MyBank2025"). It acts as a "salt."

2.  **Key Derivation (PBKDF2):**
    * The Master Passphrase and the Service Name are fed into the PBKDF2 function.
    * PBKDF2 performs a large number of hashing iterations (600,000 in this case, as defined by `PBKDF2_ITERATIONS`). This process is called "key stretching" and makes it computationally very expensive to brute-force or guess the original Master Passphrase, even if someone gets hold of the derived key.
    * The Service Name acts as a **unique salt** for each password. This is crucial because it means even if two services use the same Master Passphrase, the unique Service Name ensures that the derived keys (and thus the final passwords) will be completely different. This prevents rainbow table attacks.
    * The output of PBKDF2 is a **derived key** (a sequence of random-looking bytes).

3.  **Encoding (Base64Url):**
    * The derived key (raw bytes) is then encoded using **Base64Url**. This converts the binary data into a printable string that can be used as a password. Base64Url is used to ensure the characters are safe for URLs and filenames.
    * Finally, the resulting Base64Url string is truncated to a specific `FINAL_PASSWORD_LENGTH` (24 characters in this case) to get your final, usable password.

Because this process is **deterministic**, providing the exact same Master Passphrase and Service Name will always produce the exact same derived key and thus the exact same password.

### Why It's a Safe Solution

1.  **Client-Side Processing:** All the cryptographic operations happen directly in your web browser. Your Master Passphrase is **never** sent over the internet to any server. This eliminates the risk of your passphrase being intercepted or stored on a remote server.
2.  **No Storage:** ZenPass does not store your Master Passphrase, Service Names, or generated passwords anywhere. As soon as you close the browser tab or window, all sensitive data is cleared from memory. There's no database to hack, no server to breach.
3.  **Unique Passwords per Service:** The use of the Service Name as a unique salt ensures that even if you use the same Master Passphrase for all your accounts, each generated password will be distinct. If one service is compromised, it doesn't affect your passwords for other services.
4.  **Strong Cryptography:** PBKDF2-HMAC-SHA256 is a widely recognized and secure key derivation function recommended by NIST (National Institute of Standards and Technology). The high iteration count (600,000) makes it extremely resistant to brute-force attacks.

### Can the Algorithm Be Broken?

The **PBKDF2-HMAC-SHA256 algorithm itself, when implemented with sufficient iterations and a strong hash function (like SHA256), is considered cryptographically secure and cannot be "broken"** in a practical sense with current computing power.

However, the weakest link in any password system is almost always the **user's input**:

* **Weak Master Passphrase:** If your Master Passphrase is short, simple, or easily guessable (e.g., "password123", "yourname"), an attacker could potentially brute-force it using a dictionary attack or by trying common patterns. Even with 600,000 iterations, a very weak passphrase could still be cracked.
* **Inconsistent Service Names:** If you don't consistently use the *exact same* Service Name (including capitalization and spacing) for a given account, you won't be able to regenerate the correct password. This isn't a security flaw, but a usability one.

In summary, while the underlying cryptographic algorithm is robust, the security of your generated passwords ultimately depends on the **strength and secrecy of your Master Passphrase**. Choose a long, complex, and unique Master Passphrase that you can remember, and ZenPass will provide strong, unique passwords for all your online needs.
