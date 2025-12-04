import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
    title: "About",
    description: "Learn more about Keisuke Sunagare, a professional photographer based in Tokyo.",
};

export default function About() {
    return (
        <div className="container mx-auto px-4 py-12 md:py-24">
            <h1 className="text-6xl md:text-8xl font-bold font-oswald mb-12 uppercase tracking-tighter">
                About
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
                {/* Profile Text */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold font-oswald mb-4 uppercase tracking-tight">
                            「永遠の後輩」
                        </h2>
                        <p className="text-lg leading-relaxed text-gray-300">
                            企業のPR・広報担当／ライター／カメラマン。宇宙ベンチャー「天地人」のPR責任者や、国内最大のスタートアップイベント「IVS」のPR、RIP SLYMEのライブ写真や動画の担当をしています。スプラトゥーン3の攻略本も書きました。宣伝会議 Web広報講座の講師もやっています｡仕事のスタイルは「スタートアップからメガバンクまで」、持ち味は「永遠の後輩」です。
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold font-oswald mb-4 uppercase tracking-tight">
                            Main Roles
                        </h3>
                        <ul className="space-y-2 text-gray-300">
                            <li>• PR・広報担当</li>
                            <li>• ライター</li>
                            <li>• カメラマン</li>
                            <li>• 宣伝会議 Web広報講座 講師</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold font-oswald mb-4 uppercase tracking-tight">
                            Notable Work
                        </h3>
                        <ul className="space-y-2 text-gray-300">
                            <li>• 天地人 PR責任者</li>
                            <li>• IVS PR</li>
                            <li>• RIP SLYME ライブ写真・動画担当</li>
                            <li>• スプラトゥーン3 攻略本 執筆</li>
                        </ul>
                    </div>
                </div>

                {/* Profile Photo */}
                <div className="relative aspect-[3/4] bg-gray-900 overflow-hidden">
                    <Image
                        src="/images/profile.jpg"
                        alt="Keisuke Sunagare"
                        fill
                        className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </div>
            </div>
        </div>
    );
}
