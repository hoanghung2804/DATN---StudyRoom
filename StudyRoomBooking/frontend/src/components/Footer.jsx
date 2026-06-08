import { Link } from "react-router-dom";

function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <div className="container">
                <div className="footer-grid">
                    <div>
                        <div className="footer-brand mb-3">
                            <span className="brand-mark">SR</span>
                            <span>Study Room</span>
                        </div>
                        <p className="footer-text">
                            Hệ thống hỗ trợ sinh viên tìm phòng học, xem lịch trống,
                            gửi yêu cầu đặt phòng và check-in sử dụng phòng trong trường.
                        </p>
                    </div>

                    <div>
                        <h6>Liên kết nhanh</h6>
                        <div className="footer-links">
                            <Link to="/home">Trang chủ</Link>
                            <Link to="/rooms">Phòng học</Link>
                            <Link to="/schedule">Lịch tuần</Link>
                            <Link to="/my-bookings">Lịch của tôi</Link>
                        </div>
                    </div>

                    <div>
                        <h6>Hỗ trợ</h6>
                        <div className="footer-list">
                            <span>Phòng Đào tạo</span>
                            <span>Email: support@university.edu.vn</span>
                            <span>Hotline: 024 0000 0000</span>
                        </div>
                    </div>

                    <div>
                        <h6>Giờ hoạt động</h6>
                        <div className="footer-list">
                            <span>Đặt phòng: 07:00 - 21:00</span>
                            <span>Duyệt yêu cầu: giờ hành chính</span>
                            <span>Check-in trước/sau giờ bắt đầu theo quy định</span>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <span>© {year} Study Room Booking</span>
                    <span>Đồ án tốt nghiệp - Hệ thống quản lý đặt phòng học</span>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
