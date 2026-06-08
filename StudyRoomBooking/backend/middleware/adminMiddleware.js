const isAdmin = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            message: "Bạn chưa đăng nhập"
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Bạn không có quyền truy cập chức năng này"
        });
    }

    next();

};

module.exports = isAdmin;