"use client";

import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";

const inputClass =
  "bg-light dark:bg-dark text-dark dark:text-light rounded-md p-2 border-2 border-slate-200 dark:border-slate-800";
const btnClass =
  "bg-dark dark:bg-light text-light dark:text-dark rounded-md px-4 py-2";
const btnSmClass =
  "bg-dark dark:bg-light text-light dark:text-dark rounded-md px-3 py-1 text-sm";
const cardClass =
  "flex items-center gap-4 bg-slate-200 dark:bg-slate-800 p-4 rounded-md";
const tabClass = (active: boolean) =>
  `px-4 py-2 rounded-t-md cursor-pointer font-bold ${active ? "bg-slate-200 dark:bg-slate-800" : "hover:bg-slate-100 dark:hover:bg-slate-900"}`;

type Tab = "products" | "clients" | "transactions" | "orders" | "returns";

export default function App() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-light dark:bg-dark p-4 border-b-2 border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <span className="font-bold">The RawCodders</span>
        <SignOutButton />
      </header>
      <main className="p-8 flex flex-col gap-8">
        <Authenticated>
          <Content />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  return (
    <>
      {isAuthenticated && (
        <button
          className="bg-slate-200 dark:bg-slate-800 text-dark dark:text-light rounded-md px-2 py-1"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      )}
    </>
  );
}

function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-8 w-96 mx-auto">
      <p>Log in to see the dashboard</p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            setError(error.message);
          });
        }}
      >
        <input className={inputClass} type="email" name="email" placeholder="Email" />
        <input className={inputClass} type="password" name="password" placeholder="Password" />
        <button className={btnClass} type="submit">
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="flex flex-row gap-2">
          <span>
            {flow === "signIn" ? "Don't have an account?" : "Already have an account?"}
          </span>
          <span
            className="text-dark dark:text-light underline hover:no-underline cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </span>
        </div>
        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-2">
            <p className="text-dark dark:text-light font-mono text-xs">
              Error signing in: {error}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function Content() {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="flex gap-1 border-b-2 border-slate-200 dark:border-slate-800">
        {(["products", "clients", "transactions", "orders", "returns"] as Tab[]).map((t) => (
          <button key={t} className={tabClass(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="pt-6">
        {tab === "products" && <ProductsTab />}
        {tab === "clients" && <ClientsTab />}
        {tab === "transactions" && <TransactionsTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "returns" && <ReturnsTab />}
      </div>
    </div>
  );
}

// ─── Products ───────────────────────────────────────────────

function ProductsTab() {
  const products = useQuery(api.products.listProducts);
  const insertProduct = useMutation(api.products.insertProduct);
  const updateStock = useMutation(api.products.updateProductStock);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");

  if (products === undefined) return <p>Loading...</p>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void insertProduct({
      product: { name, price: parseFloat(price), stock: parseInt(stock), image },
    });
    setName(""); setPrice(""); setStock(""); setImage("");
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Add Product</h2>
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={inputClass} placeholder="Price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <input className={inputClass} placeholder="Stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
        <input className={inputClass} placeholder="Image URL" value={image} onChange={(e) => setImage(e.target.value)} required />
        <button className={btnClass} type="submit">Add Product</button>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Products ({products.length})</h2>
        {products.length === 0 ? <p>No products yet.</p> : products.map((p) => (
          <div key={p._id} className={cardClass}>
            <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-md" />
            <div className="flex-1">
              <p className="font-bold">{p.name}</p>
              <p className="text-sm">${p.price.toFixed(2)} | Stock: {p.stock}</p>
            </div>
            <div className="flex gap-2">
              <button className={btnSmClass} onClick={() => void updateStock({ productId: p._id, amountChange: -1 })}>-</button>
              <button className={btnSmClass} onClick={() => void updateStock({ productId: p._id, amountChange: 1 })}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Clients ────────────────────────────────────────────────

function ClientsTab() {
  const clients = useQuery(api.clients.listClients);
  const insertClient = useMutation(api.clients.insertClient);
  const deleteClient = useMutation(api.clients.deleteClient);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  if (clients === undefined) return <p>Loading...</p>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void insertClient({ name, email, phone: parseInt(phone) });
    setName(""); setEmail(""); setPhone("");
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Add Client</h2>
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={inputClass} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputClass} placeholder="Phone" type="number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <button className={btnClass} type="submit">Add Client</button>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Clients ({clients.length})</h2>
        {clients.length === 0 ? <p>No clients yet.</p> : clients.map((c) => (
          <div key={c._id} className={cardClass}>
            <div className="flex-1">
              <p className="font-bold">{c.name}</p>
              <p className="text-sm">{c.email} | Phone: {c.phone}</p>
              <p className="text-xs text-slate-500 font-mono">{c._id}</p>
            </div>
            <button className={btnSmClass} onClick={() => void deleteClient({ clientId: c._id })}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Transactions ───────────────────────────────────────────

function TransactionsTab() {
  const transactions = useQuery(api.transactions.listTransactions);
  const clients = useQuery(api.clients.listClients);
  const insertTransaction = useMutation(api.transactions.insertTransaction);
  const updateStatus = useMutation(api.transactions.updateTransactionStatus);
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);

  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("pending");

  if (transactions === undefined || clients === undefined) return <p>Loading...</p>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void insertTransaction({ clientId: clientId as Id<"clients">, status });
    setClientId(""); setStatus("pending");
  };

  const clientName = (id: Id<"clients">) => clients.find((c) => c._id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Create Transaction</h2>
        <select className={inputClass} value={clientId} onChange={(e) => setClientId(e.target.value)} required>
          <option value="">Select Client</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
          ))}
        </select>
        <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className={btnClass} type="submit">Create Transaction</button>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Transactions ({transactions.length})</h2>
        {transactions.length === 0 ? <p>No transactions yet.</p> : transactions.map((t) => (
          <div key={t._id} className={cardClass}>
            <div className="flex-1">
              <p className="font-bold">Client: {clientName(t.clientId)}</p>
              <p className="text-sm">Status: <span className="font-mono">{t.status}</span> | Total: ${t.totalPrice.toFixed(2)}</p>
              <p className="text-xs text-slate-500 font-mono">{t._id}</p>
            </div>
            <div className="flex gap-2">
              {t.status !== "completed" && (
                <button className={btnSmClass} onClick={() => void updateStatus({ transactionId: t._id, status: "completed" })}>Complete</button>
              )}
              {t.status !== "cancelled" && (
                <button className={btnSmClass} onClick={() => void updateStatus({ transactionId: t._id, status: "cancelled" })}>Cancel</button>
              )}
              <button className={btnSmClass} onClick={() => void deleteTransaction({ transactionId: t._id })}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Orders ─────────────────────────────────────────────────

function OrdersTab() {
  const orders = useQuery(api.orders.listOrders);
  const transactions = useQuery(api.transactions.listTransactions);
  const products = useQuery(api.products.listProducts);
  const insertOrder = useMutation(api.orders.insertOrder);
  const deleteOrder = useMutation(api.orders.deleteOrder);

  const [transactionId, setTransactionId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  if (orders === undefined || transactions === undefined || products === undefined) return <p>Loading...</p>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void insertOrder({
      transactionId: transactionId as Id<"transactions">,
      productId: productId as Id<"products">,
      quantity: parseInt(quantity),
    });
    setTransactionId(""); setProductId(""); setQuantity("");
  };

  const productName = (id: Id<"products">) => products.find((p) => p._id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Add Order</h2>
        <select className={inputClass} value={transactionId} onChange={(e) => setTransactionId(e.target.value)} required>
          <option value="">Select Transaction</option>
          {transactions.map((t) => (
            <option key={t._id} value={t._id}>{t._id} ({t.status})</option>
          ))}
        </select>
        <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)} required>
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>{p.name} (${p.price.toFixed(2)})</option>
          ))}
        </select>
        <input className={inputClass} placeholder="Quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        <button className={btnClass} type="submit">Add Order</button>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Orders ({orders.length})</h2>
        {orders.length === 0 ? <p>No orders yet.</p> : orders.map((o) => (
          <div key={o._id} className={cardClass}>
            <div className="flex-1">
              <p className="font-bold">Product: {productName(o.productId)}</p>
              <p className="text-sm">Quantity: {o.quantity}</p>
              <p className="text-xs text-slate-500 font-mono">Transaction: {o.transactionId}</p>
              <p className="text-xs text-slate-500 font-mono">{o._id}</p>
            </div>
            <button className={btnSmClass} onClick={() => void deleteOrder({ orderId: o._id })}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Returns ────────────────────────────────────────────────

function ReturnsTab() {
  const returns = useQuery(api.returns.listReturns);
  const orders = useQuery(api.orders.listOrders);
  const products = useQuery(api.products.listProducts);
  const insertReturn = useMutation(api.returns.insertReturn);
  const deleteReturn = useMutation(api.returns.deleteReturn);

  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");

  if (returns === undefined || orders === undefined || products === undefined) return <p>Loading...</p>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void insertReturn({ orderId: orderId as Id<"orders">, reason });
    setOrderId(""); setReason("");
  };

  const productName = (pid: Id<"products">) => products.find((p) => p._id === pid)?.name ?? pid;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Create Return</h2>
        <select className={inputClass} value={orderId} onChange={(e) => setOrderId(e.target.value)} required>
          <option value="">Select Order</option>
          {orders.map((o) => (
            <option key={o._id} value={o._id}>{productName(o.productId)} x{o.quantity} ({o._id})</option>
          ))}
        </select>
        <input className={inputClass} placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        <button className={btnClass} type="submit">Create Return</button>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Returns ({returns.length})</h2>
        {returns.length === 0 ? <p>No returns yet.</p> : returns.map((r) => (
          <div key={r._id} className={cardClass}>
            <div className="flex-1">
              <p className="font-bold">Reason: {r.reason}</p>
              <p className="text-xs text-slate-500 font-mono">Order: {r.orderId}</p>
              <p className="text-xs text-slate-500 font-mono">{r._id}</p>
            </div>
            <button className={btnSmClass} onClick={() => void deleteReturn({ returnId: r._id })}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
