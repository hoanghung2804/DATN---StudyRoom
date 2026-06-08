const maxImageSize = 2 * 1024 * 1024;

export function readImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }

        if (!file.type.startsWith("image/")) {
            reject(new Error("Vui lòng chọn đúng định dạng hình ảnh"));
            return;
        }

        if (file.size > maxImageSize) {
            reject(new Error("Ảnh không nên vượt quá 2MB"));
            return;
        }

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Không đọc được file ảnh"));
        reader.readAsDataURL(file);
    });
}
