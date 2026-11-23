using Meetly.Repository.Entity;
using Microsoft.EntityFrameworkCore.Storage;

namespace Meetly.Repository.EventScheduling;

public interface IEventRepository
{
    /// <summary>Event kèm ngày và participant/time slot, có tracking để sửa rồi SaveChanges. Không kèm email.</summary>
    Task<Events?> GetAsync(string shortCode, CancellationToken cancellationToken);

    /// <summary>Như <see cref="GetAsync"/> nhưng không tracking, dùng cho các luồng chỉ đọc (GET, realtime).</summary>
    Task<Events?> GetReadOnlyAsync(string shortCode, CancellationToken cancellationToken);

    Task<List<string>> GetEmailsAsync(Guid eventId, CancellationToken cancellationToken);
    Task<bool> ShortCodeExistsAsync(string shortCode, CancellationToken cancellationToken);
    void Add(Events eventEntity);
    void Add(EventParticipants participant);
    void ReplaceAvailableDates(Events eventEntity, ICollection<EventAvailableDates> dates);
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Tăng `Revision` nguyên tử bằng một câu UPDATE và khoá dòng event tới hết transaction,
    /// nên các lần ghi đồng thời trên cùng event luôn ra revision khác nhau và theo đúng thứ tự commit.
    /// Trả null nếu event không tồn tại hoặc (khi <paramref name="requireOpen"/>) không còn Open.
    /// </summary>
    Task<long?> TryBumpRevisionAsync(Guid eventId, bool requireOpen, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
