// サイトのコンテンツ（About / Contact）はここで一元管理する。
// 以前は Kuroco CMS から取得していたが、CMSをやめてコード側で持つ運用に変更（2026-07-06）。
// 文言を変えたいときはこのファイルを編集してcommit/pushするだけ。

export const PROFILE = {
    title: "永遠の後輩",
    bio: "企業のPR・広報担当／ライター／カメラマン。宇宙ベンチャー「天地人」でクリエイティブ＆コミュニケーションズ マネージャーを務めるほか、国内最大のスタートアップイベント「IVS」の広報責任者、RIP SLYMEのオフィシャルライブカメラマン（2022年～）、TERIYAKI BOYZのライブ撮影なども担当。宣伝会議「デジタル広報基礎講座」講師、攻殻機動隊 REALIZE PROJECT 編集長。2025年度の撮影実績は年間67件。仕事のスタイルは「スタートアップからメガバンクまで」、持ち味は「永遠の後輩」です。",
    tagline: "広報・ライター・カメラマン",
    workItems: [
        "天地人 クリエイティブ＆コミュニケーションズ マネージャー",
        "IVS 広報責任者",
        "RIP SLYME オフィシャルカメラマン（2022年～／映画パンフ表紙・25周年ファイナル）",
        "TERIYAKI BOYZ ライブ撮影（サマソニ2025 MIDNIGHT SONIC）",
        "宣伝会議「デジタル広報基礎講座」講師",
    ],
} as const;

export const CONTACT = {
    email: "nagare0313@gmail.com",
    instagram: "https://www.instagram.com/nagare0313/",
    x: "https://x.com/nagare0313/",
    locationTagline: "Available for assignments worldwide. Based in Tokyo, Japan.",
} as const;
