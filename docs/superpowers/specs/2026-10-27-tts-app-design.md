# Spec: App TTS tiếng Việt cá nhân (ElevenLabs)

Ngày: 2026-10-27 · Người dùng duy nhất: chủ app · Thiết bị: iPhone (PWA)

## Mục tiêu

Trên iPhone: dán kịch bản tiếng Việt ngắn → AI sửa → thêm cảm xúc → tạo audio bằng ElevenLabs, dùng key ElevenLabs của chính người dùng.

## Quyết định đã chốt

| # | Quyết định |
|---|---|
| Account | Người dùng tự nhập key ElevenLabs của mình (một hoặc nhiều). Tuân thủ điều khoản sử dụng của ElevenLabs. Không dùng thương mại. |
| Giọng | Không dùng Ngan (Voice Library không dùng được qua API với free). Danh sách giọng lấy từ `GET /v1/voices`, ghim Adam (`pNInz6obpgDQGcFmaJgB`) lên đầu. |
| Model | Mặc định `eleven_v4` (có audio tags). Công tắc "Nháp rẻ" = `eleven_flash_v2_5` (~0.5 credit/ký tự, **bỏ tag trước khi gửi**). |
| Độ dài | Kịch bản < 5.000 ký tự, 1 request, không chia đoạn. |
| Hosting | **Không server.** Vite + React build tĩnh, deploy Vercel/Cloudflare Pages free. Không màn đăng nhập (không có bí mật trên server). |
| Key | Mọi key (ElevenLabs, Gemini, Claude) lưu trên iPhone (IndexedDB). **iPhone gọi thẳng cả 3 API** (CORS đã kiểm chứng). Có xuất/nhập backup JSON. |
| Chọn account | Trước khi tạo: chọn account còn đủ credit. Lỗi hết credit → đánh dấu 🟡, thử account kế. Lỗi unusual activity → 🔴, thử account kế. |
| Trạng thái key | 🟢 còn credit · 🟡 hết credit (tự bỏ qua đến ngày reset, không xoá) · 🔴 bị khoá (gợi ý xoá). Thêm key → gọi `/v1/user/subscription` để kiểm tra. |
| AI sửa kịch bản | Gemini mặc định, đổi được sang Claude. Nút: Sửa chính tả · Dễ đọc thành tiếng (số/viết tắt → chữ) · Rút gọn · Kéo dài · Tự gõ yêu cầu. Kết quả hiện cạnh bản gốc, bấm "Dùng bản này" mới thay. |
| Cảm xúc tự động | Gemini chạy prompt "Enhance" do ElevenLabs công bố. Chỉ chèn tag trong danh sách, **không được sửa chữ** (kiểm tra bằng code). Duyệt trước khi dùng. |
| Cảm xúc tay | Nút 🎭 → ~30 tag có sẵn, nhãn tiếng Việt, chạm để chèn tại con trỏ. Ô tự gõ tag riêng. |
| Lịch sử | Lưu audio trên iPhone (IndexedDB). Nút lưu ra Tệp. |
| Ngoài phạm vi | Clone giọng, dubbing, SFX, STT, Studio, kịch bản dài, nhiều thiết bị, thương mại. |

## UX mobile

Nguyên tắc: **một tay, ngón cái**. Nút chính ở nửa dưới màn hình; mọi lựa chọn phụ mở bằng bottom sheet; không có trang con.

### Khung chung
- 3 tab dưới cùng: **Tạo** · **Lịch sử** · **Account**. Tôn trọng safe-area (notch, home bar).
- Mọi input font ≥ 16px (iOS không tự zoom). Vùng chạm ≥ 44px.
- Mở bằng Safari (chưa cài) → banner: "Thêm vào màn hình chính rồi mở từ đó" (dữ liệu Safari và app màn hình chính **tách riêng** trên iOS).
- Gọi `navigator.storage.persist()` để iOS không xoá dữ liệu.

### Tab Tạo (một màn hình, từ trên xuống)
1. Hàng chip: **🎙 Adam ▾** (mở sheet chọn giọng, có ▶ nghe mẫu) · **v4 / Nháp** (toggle) · **⚙** (sheet: độ ổn định 3 mức Sáng tạo/Tự nhiên/Ổn định, tốc độ 0.7–1.2).
2. Ô kịch bản chiếm phần lớn màn hình, tự lưu nháp.
3. Dòng đếm: `1.234 ký tự · ~1.234 credit · còn 63.200` (đỏ nếu không account nào đủ).
4. Hàng chip cuộn ngang: **✨ Sửa AI** · **🎭 Cảm xúc** · **🪄 Tự thêm cảm xúc** · **Xoá**.
5. Nút dính đáy, to, full width: **Tạo audio**. Khi chưa có key → đổi thành **Thêm key trước** (chuyển sang tab Account). Khi đang tạo → "Đang tạo bằng Acc 3…" + không bấm được.
6. Xong → thẻ audio hiện phía trên nút: ▶ phát · ⬇ Lưu (share sheet iOS → Lưu vào Tệp) · 🔁 Tạo lại. Không tự phát (iOS chặn).

### Tab Account
1. Thẻ tổng: `Còn 63.200 credit · 🟢 7 🟡 2 🔴 1` + nút **Làm mới**. Tự làm mới khi mở tab nếu lần kiểm tra cuối > 10 phút.
2. Nút to **＋ Thêm key** → sheet: ô "Dán 1 hoặc nhiều key, mỗi dòng 1 key" + nút **📋 Dán**. Bấm **Kiểm tra & lưu** → kiểm tra song song, hiện kết quả từng key (✅ Acc 4 · 10.000 credit / ❌ key sai / ⏭ đã có). Tên tự đặt "Acc N".
3. Danh sách: tên · thanh credit đã dùng/tổng · "reset 15/11" · chấm trạng thái. Chạm → sheet: Đổi tên · Làm mới · Xoá (xác nhận). Account 🔴 có nút Xoá đỏ hiện sẵn.
4. Mục **Key AI**: 1 ô Gemini, 1 ô Claude (ẩn ký tự, nút 📋 Dán, nút Kiểm tra).
5. Cuối trang: **Xuất backup** (share file JSON, gồm cả key AI) · **Nhập backup**.

### Tab Lịch sử
Mới nhất trên cùng. Mỗi dòng: dòng đầu kịch bản · giọng · giờ · ▶ · ⬇. Chạm → sheet: **Dùng lại kịch bản** (nạp vào tab Tạo) · Xoá.

## Đã kiểm chứng (xem `docs/spike-results.md`)
CORS cả 3 API ✅ · v4 chạy với account free ✅ · audio tags có tác dụng với tiếng Việt ✅ (người dùng nghe xác nhận) · Gemini `gemini-flash-latest` ✅. Credit/ký tự chưa đo được → dùng số tài liệu (v4 = 1, Flash = 0,5).

## Rủi ro đã chấp nhận
- Giọng Default của ElevenLabs hết hạn 31/12/2026.
