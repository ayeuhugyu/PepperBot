export function fixFileName(name: string) {
    const fileNameWithoutExtension = name.slice(0, name.lastIndexOf("."));
    const correctedFileName =
        fileNameWithoutExtension
            .toLowerCase()
            .replaceAll(" ", "_")
            .replaceAll("-", "_")
            .replaceAll("/", "_")
            .replaceAll("\\", "_")
            .replaceAll(".", "_")
            .replaceAll("|", "_")
            .replaceAll('"', "_")
            .replaceAll(":", "_")
            .replaceAll("?", "_")
            .replaceAll("*", "_")
            .replaceAll("<", "_")
            .replaceAll(">", "_")
            .replaceAll(";", "_")
            .replaceAll(",", "_")
            .slice(0, 200) + name.slice(name.lastIndexOf(".")).slice(0, 50);
    return correctedFileName;
}