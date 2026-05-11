import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import { auth } from "./firebase";
import {
  doc,
  setDoc,
  onSnapshot
} from "firebase/firestore";

import { db } from "./firebase";
import { useEffect, useMemo, useRef, useState } from "react";

type SoapItem = {
  name: string;
  quantity: number;
  sold: number;
};

type CartItem = {
  soap: string;
  quantity: number;
  wholesale: boolean;
  subtotal: number;
};

type Sale = {
  id: number;
  customer: string;
  items: CartItem[];
  total: number;
  date: string;
  time: string;
  invoiceNumber: string;
};

const SOAPS = [
  "ALOE VERA",
  "ARROZ",
  "AVENA Y MIEL",
  "CACAO",
  "CAFE",
  "CANELA",
  "CARBON",
  "COCO",
  "CURCUMA",
  "FRESA MORA",
  "FRUTILLA",
  "FRUTOS ROJOS",
  "LAVANDA",
  "LIMON",
  "MANZANA",
  "MANZANILLA",
  "MARACUYA",
  "MELON",
  "MENTA",
  "NARANJA",
  "ROSAS",
  "SANDIA",
  "TROPI FRESH",
];

export default function App() {
  const [tab, setTab] =
    useState("ventas");

  const [inventory, setInventory] =
    useState<SoapItem[]>(
      SOAPS.map((soap) => ({
        name: soap,
        quantity: 0,
        sold: 0
      }))
    );

  const [sales, setSales] =
    useState<Sale[]>([]);

  const [customer, setCustomer] =
    useState("");

  const [soap, setSoap] =
    useState(SOAPS[0]);

  const [quantity, setQuantity] =
    useState(1);

  const [wholesale, setWholesale] =
    useState(false);

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [invoiceImage, setInvoiceImage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [user, setUser] =
    useState<any>(null);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const canvasRef =
    useRef<HTMLCanvasElement>(null);
  const syncFirebase = async (
    newInventory: any,
    newSales: any
  ) => {

    await setDoc(
      doc(db, "jeymood", "data"),
      {
        inventory: newInventory,
        sales: newSales
      }
    );

  };
  useEffect(() => {

    const unsubscribe =
      onSnapshot(
        doc(db, "jeymood", "data"),
        (snapshot) => {

          if (snapshot.exists()) {

            const data =
              snapshot.data();

            setInventory(
              data.inventory ||
              SOAPS.map((soap) => ({
                name: soap,
                quantity: 0,
                sold: 0
              }))
            );

            setSales(
              data.sales || []
            );

          } else {

            setInventory(
              SOAPS.map((soap) => ({
                name: soap,
                quantity: 0,
                sold: 0
              }))
            );

            setSales([]);

          }

        }
      );

    return () =>
      unsubscribe();

  }, []);

  const calculatePrice = (
    qty: number,
    wholesalePrice: boolean
  ) => {
    if (wholesalePrice) {
      return qty * 1.25;
    }

    const packs =
      Math.floor(qty / 4);

    const remaining =
      qty % 4;

    return (
      packs * 5 +
      remaining * 1.5
    );
  }; useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          setUser(currentUser);

          if (
            currentUser?.email ===
            "jonathanmazabanda728@gmail.com"
          ) {

            setIsAdmin(true);

          } else {

            setIsAdmin(false);

          }

        }
      );

    return () =>
      unsubscribe();

  }, []);

  const addToCart = () => {
    if (!customer.trim()) {
      alert(
        "Ingrese cliente"
      );
      return;
    }

    const subtotal =
      calculatePrice(
        quantity,
        wholesale
      );

    setCart((prev) => [
      ...prev,
      {
        soap,
        quantity,
        wholesale,
        subtotal,
      },
    ]);

    setQuantity(1);
  };

  const removeCartItem = (
    index: number
  ) => {
    setCart((prev) =>
      prev.filter(
        (_, i) =>
          i !== index
      )
    );
  };

  const total = useMemo(() => {
    return cart.reduce(
      (acc, item) =>
        acc + item.subtotal,
      0
    );
  }, [cart]);

  const generateInvoice = () => {
    if (cart.length === 0) {
      alert(
        "No hay productos"
      );
      return;
    }

    const now =
      new Date();

    const date =
      now.toLocaleDateString();

    const time =
      now.toLocaleTimeString();

    const invoiceNumber =
      String(
        sales.length + 1
      ).padStart(
        4,
        "0"
      );

    const newSale: Sale = {
      id: Date.now(),
      customer,
      items: cart,
      total,
      date,
      time,
      invoiceNumber,
    };

    const updatedInventory =
      [...inventory];

    cart.forEach((item) => {
      const found =
        updatedInventory.find(
          (i) =>
            i.name === item.soap
        );

      if (found) {
        found.quantity -=
          item.quantity;

        found.sold +=
          item.quantity;

        if (
          found.quantity < 0
        ) {
          found.quantity = 0;
        }
      }
    });

    setInventory(
      updatedInventory
    );
    syncFirebase(
      updatedInventory,
      [
        newSale,
        ...sales
      ]
    );
    setSales((prev) => [
      newSale,
      ...prev,
    ]);

    createInvoiceImage(
      newSale
    );

    setCart([]);
    setCustomer("");
  };

  const createInvoiceImage = (
    sale: Sale
  ) => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext(
        "2d"
      );

    if (!ctx) return;

    canvas.width = 420;
    canvas.height = 900;

    ctx.fillStyle =
      "#ffffff";

    ctx.fillRect(
      0,
      0,
      420,
      900
    );

    // HEADER
    ctx.fillStyle =
      "#ec4899";

    ctx.fillRect(
      0,
      0,
      420,
      130
    );

    // TEXTO HEADER
    ctx.fillStyle =
      "#ffffff";

    ctx.font =
      "bold 34px Arial";

    ctx.fillText(
      "JEYMOOD",
      120,
      55
    );

    ctx.font =
      "18px Arial";

    ctx.fillText(
      "Jabones Artesanales",
      120,
      85
    );

    // DATOS
    ctx.fillStyle =
      "#111827";

    ctx.font =
      "bold 22px Arial";

    ctx.fillText(
      `NOTA #${sale.invoiceNumber}`,
      20,
      170
    );

    ctx.font =
      "18px Arial";

    ctx.fillText(
      `Cliente: ${sale.customer}`,
      20,
      210
    );

    ctx.fillText(
      `Fecha: ${sale.date}`,
      20,
      240
    );

    ctx.fillText(
      `Hora: ${sale.time}`,
      20,
      270
    );

    // PRODUCTOS
    let y = 330;

    sale.items.forEach(
      (item) => {
        ctx.fillStyle =
          "#ec4899";

        ctx.font =
          "bold 18px Arial";

        ctx.fillText(
          item.soap,
          20,
          y
        );

        ctx.fillStyle =
          "#111827";

        ctx.font =
          "16px Arial";

        ctx.fillText(
          `Cantidad: ${item.quantity}`,
          180,
          y
        );

        ctx.fillText(
          `$${item.subtotal.toFixed(
            2
          )}`,
          330,
          y
        );

        y += 35;
      }
    );

    // TOTAL
    y += 40;

    ctx.fillStyle =
      "#ec4899";

    ctx.font =
      "bold 30px Arial";

    ctx.fillText(
      `TOTAL: $${sale.total.toFixed(
        2
      )}`,
      20,
      y
    );

    // MENSAJE
    y += 100;

    ctx.textAlign =
      "center";

    ctx.fillStyle =
      "#111827";

    ctx.font =
      "bold 24px Arial";

    ctx.fillText(
      "GRACIAS POR PREFERIRNOS",
      210,
      y
    );

    y += 40;

    ctx.font =
      "18px Arial";

    ctx.fillStyle =
      "#6b7280";

    ctx.fillText(
      "JEYMOOD ✨",
      210,
      y
    );

    const image =
      canvas.toDataURL(
        "image/png"
      );

    setInvoiceImage(
      image
    );
  };

  const updateQuantity = (
    name: string,
    value: number
  ) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.name === name
          ? {
            ...item,
            quantity: value,
          }
          : item
      )
    );
  };

  const deleteSale = (
    saleId: number
  ) => {
    const password =
      prompt(
        "Ingrese clave administrador"
      );

    if (
      password !== "1425"
    ) {
      alert(
        "Clave incorrecta"
      );
      return;
    }

    const sale =
      sales.find(
        (s) =>
          s.id === saleId
      );

    if (!sale) return;

    const updatedInventory =
      [...inventory];

    sale.items.forEach(
      (item) => {
        const found =
          updatedInventory.find(
            (i) =>
              i.name === item.soap
          );

        if (found) {
          found.quantity +=
            item.quantity;

          found.sold -=
            item.quantity;

          if (
            found.sold < 0
          ) {
            found.sold = 0;
          }
        }
      }
    );

    setInventory(
      updatedInventory
    );

    setSales((prev) =>
      prev.filter(
        (s) =>
          s.id !== saleId
      )
    );
    const updatedSales =
      sales.filter(
        (s) =>
          s.id !== saleId
      );

    syncFirebase(
      updatedInventory,
      updatedSales
    );
    alert(
      "Venta eliminada"
    );
  };

  const filteredSales =
    sales.filter((sale) =>
      sale.customer
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  const totalGeneral =
    inventory.reduce(
      (acc, item) =>
        acc + item.quantity,
      0
    );

  const login = async () => {

    const provider =
      new GoogleAuthProvider();

    await signInWithPopup(
      auth,
      provider
    );

  };

  const logout = async () => {

    await signOut(auth);

  };
  return (
    <div className="min-h-screen bg-pink-50 text-gray-800 pb-20">
      <div className="p-4 flex justify-between items-center bg-white shadow rounded-2xl mb-4">

        {user ? (

          <div className="flex items-center gap-3">

            <img
              src={user.photoURL}
              className="w-10 h-10 rounded-full"
            />

            <div>

              <div className="font-bold">
                {user.displayName}
              </div>

              <div className="text-xs text-gray-500">
                {isAdmin
                  ? "Administrador"
                  : "Empleado"}
              </div>

            </div>

          </div>

        ) : (

          <button
            onClick={login}
            className="bg-pink-500 text-white px-5 py-3 rounded-2xl font-bold"
          >
            Iniciar sesión
          </button>

        )}

        {user && (

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-xl"
          >
            Salir
          </button>

        )}

      </div>

      {/* MENU */}
      <div className="sticky top-0 bg-white shadow-lg p-4 flex justify-around z-50">

        <button
          onClick={() =>
            setTab(
              "ventas"
            )
          }
          className={`px-4 py-3 rounded-2xl font-bold ${tab === "ventas"
            ? "bg-pink-500 text-white"
            : "bg-pink-100"
            }`}
        >
          Ventas
        </button>

        <button
          onClick={() =>
            setTab(
              "inventario"
            )
          }
          className={`px-4 py-3 rounded-2xl font-bold ${tab ===
            "inventario"
            ? "bg-pink-500 text-white"
            : "bg-pink-100"
            }`}
        >
          Inventario
        </button>

        <button
          onClick={() =>
            setTab(
              "historial"
            )
          }
          className={`px-4 py-3 rounded-2xl font-bold ${tab ===
            "historial"
            ? "bg-pink-500 text-white"
            : "bg-pink-100"
            }`}
        >
          Historial
        </button>

      </div>

      {/* VENTAS */}
      {tab === "ventas" && (
        <div className="p-4 space-y-4">

          <div className="bg-white p-5 rounded-3xl shadow-lg space-y-4">

            <h1 className="text-3xl font-black text-pink-600">
              JEYMOOD POS
            </h1>

            <input
              type="text"
              placeholder="Cliente"
              value={customer}
              onChange={(e) =>
                setCustomer(
                  e.target.value
                )
              }
              className="w-full p-4 border rounded-2xl"
            />

            <select
              value={soap}
              onChange={(e) =>
                setSoap(
                  e.target.value
                )
              }
              className="w-full p-4 border rounded-2xl"
            >
              {SOAPS.map(
                (item) => (
                  <option
                    key={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-full p-4 border rounded-2xl"
            />

            <label className="flex items-center gap-3 bg-pink-50 p-4 rounded-2xl">

              <input
                type="checkbox"
                checked={wholesale}
                onChange={(e) =>
                  setWholesale(
                    e.target.checked
                  )
                }
              />

              <span className="font-bold">
                Precio Mayorista ($1.25)
              </span>

            </label>

            <button
              onClick={addToCart}
              className="w-full bg-pink-500 text-white p-4 rounded-2xl font-bold"
            >
              Agregar al listado
            </button>

          </div>

          {/* LISTADO */}
          <div className="bg-white p-5 rounded-3xl shadow-lg">

            <h2 className="text-2xl font-bold mb-4">
              Nota de Venta
            </h2>

            <div className="space-y-3">

              {cart.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={index}
                    className="bg-pink-50 p-4 rounded-2xl flex justify-between"
                  >

                    <div>

                      <div className="font-bold">
                        {item.soap}
                      </div>

                      <div>
                        Cantidad:
                        {" "}
                        {item.quantity}
                      </div>

                      <div>
                        Tipo:
                        {" "}
                        {item.wholesale
                          ? "Mayorista"
                          : "Normal"}
                      </div>

                      <div className="text-pink-600 font-bold">
                        $
                        {item.subtotal.toFixed(
                          2
                        )}
                      </div>

                    </div>

                    <button
                      onClick={() =>
                        removeCartItem(
                          index
                        )
                      }
                      className="bg-red-500 text-white px-4 py-2 rounded-xl"
                    >
                      X
                    </button>

                  </div>
                )
              )}

            </div>

            <div className="mt-5 text-3xl font-black text-pink-600">
              TOTAL: $
              {total.toFixed(
                2
              )}
            </div>

            <button
              onClick={
                generateInvoice
              }
              className="w-full mt-5 bg-green-500 text-white p-4 rounded-2xl font-bold"
            >
              Generar Factura
            </button>

          </div>

          {/* FACTURA */}
          {invoiceImage && (
            <div className="bg-white rounded-3xl shadow-lg p-5 space-y-4">

              <h2 className="text-2xl font-black text-center text-pink-600">
                Factura Generada
              </h2>

              <img
                src={invoiceImage}
                alt="Factura"
                className="w-full rounded-2xl border"
              />

              <button
                onClick={() => {
                  const link =
                    document.createElement(
                      "a"
                    );

                  link.href =
                    invoiceImage;

                  link.download =
                    `factura-${Date.now()}.png`;

                  link.click();
                }}
                className="w-full bg-pink-500 text-white p-4 rounded-2xl font-bold"
              >
                Descargar Imagen
              </button>

              <button
                onClick={() => {
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(
                      "Hola 👋 aquí está tu factura JEYMOOD"
                    )}`,
                    "_blank"
                  );
                }}
                className="w-full bg-green-500 text-white p-4 rounded-2xl font-bold"
              >
                Compartir por WhatsApp
              </button>

              <div className="bg-pink-50 p-5 rounded-3xl text-center">

                <h3 className="text-xl font-black text-pink-600 mb-4">
                  Factura QR
                </h3>

                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(invoiceImage)}`}
                  alt="QR"
                  className="mx-auto rounded-2xl border"
                />

              </div>

            </div>
          )}

          <canvas
            ref={canvasRef}
            className="hidden"
          />

        </div>
      )}

      {/* INVENTARIO */}
      {tab === "inventario" && (
        <div className="p-4">

          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

            <table className="w-full text-sm">

              <thead className="bg-pink-500 text-white">

                <tr>

                  <th className="p-3">
                    Jabón
                  </th>

                  <th className="p-3">
                    Cantidad
                  </th>

                  <th className="p-3">
                    Vendido
                  </th>

                  <th className="p-3">
                    Subtotal
                  </th>

                </tr>

              </thead>

              <tbody>

                {inventory.map(
                  (item) => (
                    <tr
                      key={item.name}
                      className="border-b"
                    >

                      <td className="p-3 font-bold">
                        {item.name}
                      </td>

                      <td className="p-3">

                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.name,
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-20 border rounded-xl p-2"
                        />

                      </td>

                      <td className="p-3">
                        {item.sold}
                      </td>

                      <td className="p-3">
                        {item.quantity}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

            <div className="bg-pink-50 p-5 text-2xl font-black">
              TOTAL GENERAL:
              {" "}
              {totalGeneral}
            </div>

          </div>

        </div>
      )}

      {/* HISTORIAL */}
      {tab === "historial" && isAdmin && (
        <div className="p-4 space-y-4">

          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="w-full p-4 rounded-2xl border"
          />

          {filteredSales.map(
            (sale) => (
              <div
                key={sale.id}
                className="bg-white rounded-3xl shadow-lg p-5"
              >

                <div className="flex justify-between items-center">

                  <div>

                    <div className="text-2xl font-black text-pink-600">
                      {sale.customer}
                    </div>

                    <div className="text-sm text-gray-500">
                      Nota #
                      {sale.invoiceNumber}
                    </div>

                    <div className="text-sm text-gray-500">
                      {sale.date}
                      {" - "}
                      {sale.time}
                    </div>

                  </div>
                  {isAdmin && (
                    <button
                      onClick={() =>
                        deleteSale(
                          sale.id
                        )
                      }
                      className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold"
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-2">

                  {sale.items.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={index}
                        className="bg-pink-50 rounded-2xl p-3 flex justify-between"
                      >

                        <div>
                          {item.soap}
                        </div>

                        <div>
                          x
                          {item.quantity}
                        </div>

                      </div>
                    )
                  )}

                </div>

                <div className="mt-4 text-2xl font-black text-pink-600">
                  TOTAL: $
                  {sale.total.toFixed(
                    2
                  )}
                </div>

              </div>
            )
          )}

        </div>
      )}

    </div>
  );
}