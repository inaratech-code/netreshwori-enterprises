"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const variants = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
};

const transition = {
    duration: 0.15,
    ease: [0.25, 0.1, 0.25, 1],
};

export default function PageTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={variants}
                transition={transition}
                className="min-h-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
