"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import {
    updateProfile,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
} from "firebase/auth";
import { api } from "@/lib/api";

export default function ProfilePage() {
    const { user, dbUserId } = useAuth();

    // Info form
    const [name, setName] = useState(user?.displayName ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [infoPassword, setInfoPassword] = useState("");
    const [infoMsg, setInfoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [infoLoading, setInfoLoading] = useState(false);

    // Password form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [pwLoading, setPwLoading] = useState(false);

    const emailChanged = email !== user?.email;

    const handleUpdateInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        setInfoLoading(true);
        setInfoMsg(null);
        try {
            if (emailChanged) {
                if (!infoPassword) {
                    setInfoMsg({ type: "error", text: "Enter your current password to change email." });
                    setInfoLoading(false);
                    return;
                }
                const credential = EmailAuthProvider.credential(user!.email!, infoPassword);
                await reauthenticateWithCredential(auth.currentUser, credential);
                await updateEmail(auth.currentUser, email);
            }
            if (name !== user?.displayName) {
                await updateProfile(auth.currentUser, { displayName: name });
            }
            if (dbUserId) {
                await api.updateUser(dbUserId, { name, email });
            }
            setInfoMsg({ type: "success", text: "Profile updated successfully." });
            setInfoPassword("");
        } catch (err: any) {
            setInfoMsg({ type: "error", text: err.message ?? "Failed to update profile." });
        } finally {
            setInfoLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        if (newPassword !== confirmPassword) {
            setPwMsg({ type: "error", text: "Passwords do not match." });
            return;
        }
        if (newPassword.length < 6) {
            setPwMsg({ type: "error", text: "Password must be at least 6 characters." });
            return;
        }
        setPwLoading(true);
        setPwMsg(null);
        try {
            const credential = EmailAuthProvider.credential(user!.email!, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            setPwMsg({ type: "success", text: "Password changed successfully." });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setPwMsg({ type: "error", text: err.message ?? "Failed to change password." });
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Profile</h1>

            {/* Update Info */}
            <div className="rounded-xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-6 space-y-4">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Account Info</h2>
                <form onSubmit={handleUpdateInfo} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 bg-white dark:bg-zinc-800  border-zinc-300 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    {emailChanged && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Current Password (required to change email)
                            </label>
                            <input
                                type="password"
                                value={infoPassword}
                                onChange={e => setInfoPassword(e.target.value)}
                                className="w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    )}
                    {infoMsg && (
                        <p className={`text-sm ${infoMsg.type === "success" ? "text-green-600" : "text-red-500"}`}>
                            {infoMsg.text}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={infoLoading}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {infoLoading ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            </div>

            {/* Change Password */}
            <div className="rounded-xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-6 space-y-4">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Current Password
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            required
                            className="w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                            className="w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            className="w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    {pwMsg && (
                        <p className={`text-sm ${pwMsg.type === "success" ? "text-green-600" : "text-red-500"}`}>
                            {pwMsg.text}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={pwLoading}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {pwLoading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
