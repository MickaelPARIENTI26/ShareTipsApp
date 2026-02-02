using System.Security.Cryptography;
using System.Text;

namespace ShareTipsBackend.Utilities;

/// <summary>
/// Utility for hashing tokens before storing in database.
/// Uses SHA256 which is fast and suitable for random tokens.
/// </summary>
public static class TokenHasher
{
    /// <summary>
    /// Hash a token using SHA256
    /// </summary>
    public static string Hash(string token)
    {
        if (string.IsNullOrEmpty(token))
            throw new ArgumentNullException(nameof(token));

        var bytes = Encoding.UTF8.GetBytes(token);
        var hash = SHA256.HashData(bytes);
        return Convert.ToBase64String(hash);
    }

    /// <summary>
    /// Verify a token against its hash
    /// </summary>
    public static bool Verify(string token, string hash)
    {
        if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(hash))
            return false;

        var computedHash = Hash(token);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computedHash),
            Encoding.UTF8.GetBytes(hash));
    }
}
