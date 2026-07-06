import type { Metadata } from "next";
import Image from "next/image";
import { getProfile, getWorkItems } from "@/lib/kuroco";

export const metadata: Metadata = {
    title: "About",
    description: "Learn more about Keisuke Sunagare, a professional photographer based in Tokyo.",
};

export default async function About() {
    const profile = await getProfile();
    const title = profile.title ?? "永遠の後輩";
    const bio = profile.bio ?? "";
    const tagline = profile.tagline ?? "広報・ライター・カメラマン";
    const workItems = getWorkItems(profile);

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
                            「{title}」
                        </h2>
                        <p className="text-lg leading-relaxed text-gray-800">
                            {bio}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold font-oswald mb-4 uppercase tracking-tight">
                            Tagline
                        </h3>
                        <p className="text-gray-800">{tagline}</p>
                    </div>

                    {workItems.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold font-oswald mb-4 uppercase tracking-tight">
                                Notable Work
                            </h3>
                            <ul className="space-y-2 text-gray-800">
                                {workItems.map((item, i) => (
                                    <li key={i}>• {item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Profile Photo */}
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
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
