namespace Meetly.Contract.DTOs.Common;

public sealed record ApiResponse<T>(
    bool IsSuccess,
    int Code,
    string Message,
    T? Value)
{
    public static ApiResponse<T> Success(int code, string message, T value) =>
        new(true, code, message, value);

    public static ApiResponse<T> Failure(int code, string message) =>
        new(false, code, message, default);
}
