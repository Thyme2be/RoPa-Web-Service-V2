export type DashboardData = {
    totalDocs: number;
    docsToEdit: { owner: number; processor: number };
    risk: { low: number; medium: number; high: number; total: number };
    pendingDpo: { store: number; destroy: number };
    pendingDocs: { owner: number; processor: number };
    approved: number;
    sensitive: number;
    delayed: number;
    annualCheck: { reviewed: number; notReviewed: number };
    dueDestroy: number;
    destroyed: number;
};

export const globalMockDashboardData: Record<string, DashboardData> = {
    weekly: {
        totalDocs: 24,
        docsToEdit: { owner: 3, processor: 1 },
        risk: { low: 18, medium: 4, high: 2, total: 24 },
        pendingDpo: { store: 5, destroy: 2 },
        pendingDocs: { owner: 4, processor: 2 },
        approved: 8,
        sensitive: 5,
        delayed: 1,
        annualCheck: { reviewed: 2, notReviewed: 22 },
        dueDestroy: 2,
        destroyed: 1,
    },
    monthly: {
        totalDocs: 100,
        docsToEdit: { owner: 10, processor: 5 },
        risk: { low: 70, medium: 20, high: 10, total: 100 },
        pendingDpo: { store: 20, destroy: 30 },
        pendingDocs: { owner: 20, processor: 30 },
        approved: 20,
        sensitive: 42,
        delayed: 5,
        annualCheck: { reviewed: 20, notReviewed: 15 },
        dueDestroy: 20,
        destroyed: 42,
    },
    "6months": {
        totalDocs: 450,
        docsToEdit: { owner: 25, processor: 15 },
        risk: { low: 300, medium: 100, high: 50, total: 450 },
        pendingDpo: { store: 50, destroy: 45 },
        pendingDocs: { owner: 40, processor: 55 },
        approved: 280,
        sensitive: 150,
        delayed: 12,
        annualCheck: { reviewed: 120, notReviewed: 330 },
        dueDestroy: 45,
        destroyed: 110,
    },
    yearly: {
        totalDocs: 980,
        docsToEdit: { owner: 40, processor: 22 },
        risk: { low: 700, medium: 200, high: 80, total: 980 },
        pendingDpo: { store: 85, destroy: 90 },
        pendingDocs: { owner: 60, processor: 75 },
        approved: 650,
        sensitive: 320,
        delayed: 25,
        annualCheck: { reviewed: 400, notReviewed: 580 },
        dueDestroy: 90,
        destroyed: 250,
    },
    all: {
        totalDocs: 2150,
        docsToEdit: { owner: 85, processor: 40 },
        risk: { low: 1500, medium: 450, high: 200, total: 2150 },
        pendingDpo: { store: 150, destroy: 180 },
        pendingDocs: { owner: 120, processor: 140 },
        approved: 1450,
        sensitive: 680,
        delayed: 45,
        annualCheck: { reviewed: 1100, notReviewed: 1050 },
        dueDestroy: 180,
        destroyed: 520,
    },
};
