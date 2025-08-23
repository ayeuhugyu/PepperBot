import { screenshotUrl } from "../src/lib/screenshotUrl";

await screenshotUrl("https://example.com", { 
    resolution: { width: 1920, height: 1080 },
    fullPage: true,
    savePath: "containers/tmp.png"
});
