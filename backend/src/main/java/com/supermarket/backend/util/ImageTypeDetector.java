package com.supermarket.backend.util;

public final class ImageTypeDetector {

    private ImageTypeDetector() {
    }

    public static String detect(byte[] bytes) {
        if (bytes == null) {
            return null;
        }

        if (matches(bytes, 0, 0xFF, 0xD8, 0xFF)) {
            return "image/jpeg";
        }

        if (matches(bytes, 0, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) {
            return "image/png";
        }

        if (bytes.length >= 12
                && matches(bytes, 0, 'R', 'I', 'F', 'F')
                && matches(bytes, 8, 'W', 'E', 'B', 'P')) {
            return "image/webp";
        }

        return null;
    }

    private static boolean matches(byte[] bytes, int offset, int... expected) {
        if (bytes.length < offset + expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if ((bytes[offset + i] & 0xFF) != expected[i]) {
                return false;
            }
        }
        return true;
    }
}