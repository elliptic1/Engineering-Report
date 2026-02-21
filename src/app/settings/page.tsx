"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { getUsage, type UsageData } from "@/lib/usage";

function CheckoutBanner() {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");

  if (checkoutStatus === "success") {
    return (
      <div className="mt-4 rounded-lg border border-primary-500/60 bg-primary-500/10 p-4 text-primary-400">
        Your upgrade was successful! Your Pro plan is now active.
      </div>
    );
  }
  if (checkoutStatus === "cancelled") {
    return (
      <div className="mt-4 rounded-lg border border-yellow-500/60 bg-yellow-500/10 p-4 text-yellow-300">
        Checkout was cancelled. You can upgrade anytime.
      </div>
    );
  }
  return null;
}

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.uid) {
      setUsageLoading(false);
      return;
    }

    let cancelled = false;

    getUsage(user.uid)
      .then((data) => {
        if (!cancelled) {
          setUsage(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch usage:", err);
      })
      .finally(() => {
        if (!cancelled) {
          setUsageLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const handleUpgrade = async () => {
    if (!user) return;

    setIsUpgrading(true);
    setUpgradeError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
        }),
      });

      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };

      if (!data.ok || !data.url) {
        setUpgradeError(data.error || "Failed to start checkout.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setUpgradeError("Network error. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
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

  const usageCount = usage?.count ?? 0;
  const usageLimit = usage?.limit ?? 5;
  const usagePercent = Math.min((usageCount / usageLimit) * 100, 100);
  const atLimit = usageCount >= usageLimit;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      <Suspense>
        <CheckoutBanner />
      </Suspense>

      {/* Profile Section */}
      <section className="mt-8 rounded-xl border border-dark-600 bg-dark-800 p-6">
        <h2 className="text-xl font-semibold text-white">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          {user.photoURL && (
            <Image
              src={user.photoURL}
              alt={user.displayName || "User"}
              width={64}
              height={64}
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
            {upgradeError && (
              <p className="mt-2 text-sm text-red-400">{upgradeError}</p>
            )}
          </div>
        </div>
      </section>

      {/* Usage Section */}
      <section className="mt-8 rounded-xl border border-dark-600 bg-dark-800 p-6">
        <h2 className="text-xl font-semibold text-white">Usage This Month</h2>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Analyses used</span>
            {usageLoading ? (
              <span className="h-4 w-12 animate-pulse rounded bg-dark-700" />
            ) : (
              <span className={atLimit ? "text-red-400 font-medium" : "text-white"}>
                {usageCount} / {usageLimit}
              </span>
            )}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-dark-700">
            <div
              className={`h-full transition-all ${atLimit ? "bg-red-500" : "bg-primary-500"}`}
              style={{ width: usageLoading ? "0%" : `${usagePercent}%` }}
            />
          </div>
          {atLimit && !usageLoading && (
            <p className="mt-3 text-sm text-red-400">
              You have reached your monthly analysis limit. Upgrade to Pro for
              100 analyses per month.
            </p>
          )}
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
