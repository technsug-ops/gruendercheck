import RaporTool from "./RaporTool";
import "./rapor.css";

// Yönetici: rapor Markdown'ını önizle ve PDF olarak kaydet. Panelin "Önizle / PDF" düğmesi metni
// sessionStorage'a (rapor_md, rapor_lang) yazıp bu sayfayı açar. Hiçbir şey sunucuya gönderilmez.
export default function RaporPage() {
  return <RaporTool />;
}
