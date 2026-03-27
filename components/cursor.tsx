"use client"
import React from 'react';
import { useMousePosition } from '@/hooks/mousePosition';

export default function Cursor() {
    const { x, y } = useMousePosition();

    return (
        <div
            style={{ transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`, width: 20, height: 20, backgroundColor: 'skyblue', borderRadius: '50%', position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999, opacity: 0.6 }}
        />
    )
}
