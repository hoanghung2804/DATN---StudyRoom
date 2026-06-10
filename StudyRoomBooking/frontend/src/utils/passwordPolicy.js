export const STUDENT_PASSWORD_HINT = "Tối thiểu 8 ký tự, có ít nhất 1 chữ viết hoa và 1 ký tự đặc biệt.";

export function validateStudentPassword(password) {
    if (!password || password.length < 8) {
        return "Mật khẩu sinh viên phải có tối thiểu 8 ký tự.";
    }

    if (!/[A-Z]/.test(password)) {
        return "Mật khẩu sinh viên phải có ít nhất 1 chữ viết hoa.";
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Mật khẩu sinh viên phải có ít nhất 1 ký tự đặc biệt.";
    }

    return "";
}
