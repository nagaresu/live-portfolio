"use client";

import { MotionConfig } from "framer-motion";

// framer-motion のアニメーションをOSの「動きを減らす」設定に従わせる。
// reducedMotion="user" ＝ prefers-reduced-motion: reduce のとき transform/opacity 以外の動きを止める。
export default function Providers({ children }: { children: React.ReactNode }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
