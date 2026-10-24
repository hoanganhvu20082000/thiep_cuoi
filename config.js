// Sửa nội dung thiệp tại đây. Trường nào để "" sẽ tự ẩn.
window.WEDDING = {
  groom: "Anh Vũ",
  bride: "Phương Thảo",

  // Ngày giờ dùng cho đồng hồ đếm ngược (giờ VN). TODO: chỉnh giờ khi chốt.
  date: "2026-12-06T17:00:00+07:00",
  dateText: "06.12.2026",
  weekday: "Chủ Nhật",
  lunarText: "Nhằm ngày 28 tháng 10 năm Bính Ngọ",
  time: "", // TODO: ví dụ "Đón khách 17:00 · Khai tiệc 18:00"

  groomFamily: { title: "Nhà Trai", role: "Trưởng nam", father: "", mother: "", place: "" },
  brideFamily: { title: "Nhà Gái", role: "Ái nữ", father: "", mother: "", place: "" },

  venue: {
    name: "Trung Tâm Tiệc Cưới & Hội Nghị Bright Star",
    hall: "", // TODO: tên sảnh nếu có
    address: "Số 782 – 784 Xa Lộ Hà Nội, TP. Biên Hòa, Đồng Nai",
    mapQuery: "Trung Tâm Tiệc Cưới Bright Star Biên Hòa"
  },

  heroPhoto: "assets/photos/photo_22.jpg",
  // Chỉ vài tấm cho album nhỏ
  album: ["photo_03", "photo_05", "photo_08", "photo_13", "photo_17", "photo_25"],

  // URL Google Form (/formResponse) hoặc Apps Script để nhận RSVP. Trống = chỉ lưu trên máy khách.
  rsvpEndpoint: ""
};
