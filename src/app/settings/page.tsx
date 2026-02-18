"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    // TODO: Integrate Stripe checkout
    // For now, just show a placeholder
    setTimeout(() => {
      setIsUpgrading(false);
      alert("Stripe checkout integration coming soon!");
    }, 1000);
  };

  if (loading) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-dark-600 border-t-primary-500" />
          Loading...
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      {/* Profile Section */}
      <section className="mt-8 rounded-xl border border-dark-600 bg-dark-800 p-6">
        <h2 className="text-xl font-semibold text-white">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              className="h-16 w-16 rounded-full"
            />
          )}
          <div>
            <p className="text-lg font-medium text-white">
              {user.displayName || "Anonymous"}
            </p>
            <p className="text-slate-400">{user.email}</p>
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="mt-8 rounded-xl border border-dark-600 bg-dark-800 p-6">
        <h2 className="text-xl font-semibold text-white">Subscription</h2>
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-white">Free Plan</p>
              <p className="text-slate-400">5 analyses per month</p>
            </div>
            <span className="rounded-full bg-dark-700 px-3 py-1 text-sm text-slate-300">
              Current Plan
            </span>
          </div>

          <div className="mt-6 rounded-lg border border-primary-500/30 bg-primary-500/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-white">Upgrade to Pro</p>
                <p className="text-slate-400">
                  100 analyses/month • Private repos • 365-day history
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">$29</p>
                <p className="text-sm text-slate-400">/month</p>
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="mt-4 w-full rounded-lg bg-primary-500 px-6 py-3 font-semibold text-dark-900 transition hover:bg-primary-400 disabled:opacity-50"
            >
              {isUpgrading ? "Processing..." : "Upgrade to Pro"}
            </button>
          </div>
        </div>
      </section>

      {/* Usage Section */}
      <section className="mt-8 rounded-xl border border-dark-600 bg-dark-800 p-6">
        <h2 className="text-xl font-semibold text-white">Usage This Month</h2>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Analyses used</span>
            <span className="text-white">0 / 5</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-dark-700">
            <div
              className="h-full bg-primary-500 transition-all"
              style={{ width: "0%" }}
            />
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="mt-8 rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Sign out of your account</p>
            <p className="text-sm text-slate-400">
              You will need to sign in again to access your data.
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            Sign Out
          </button>
        </div>
      </section>
    </main>
  );
}
