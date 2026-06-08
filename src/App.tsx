import {
  doc,
  setDoc,
  onSnapshot
} from "firebase/firestore";

import { db } from "./firebase";
import { useEffect, useMemo, useRef, useState } from "react";
import logoImg from "./assets/logo.png";
type SoapItem = {
  name: string;
  quantity: number;
  sold: number;
};

type CartItem = {
  soap: string;
  quantity: number;
  subtotal: number;
};

type Sale = {
  id: number;
  type: "jabones" | "racimos";
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
  "PIÑA COCO",
  "ROMERO",
  "ROSAS",
  "SANDIA",
  "TROPI FRESH",

];
const RACIMOS = [
  "COCO",
  "FRESA MORA",
  "FRUTILLA",
  "FRUTOS ROJOS",
  "LIMON",
  "MANZANA",
  "MARACUYA",
  "NARANJA",
  "PIÑA COCO",
  "ROSAS",
  "SANDIA",
  "UVA MORADA",
  "UVA VERDE",
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
  const [racimoInventory, setRacimoInventory] =
    useState<SoapItem[]>(
      RACIMOS.map((item) => ({
        name: item,
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

  const [promoMode, setPromoMode] =
    useState(false);

  const [racimoMixMode, setRacimoMixMode] =
    useState(false);

  const [racimoMixItems, setRacimoMixItems] =
    useState<string[]>([]);

  const [promoMixItems, setPromoMixItems] =
    useState<string[]>([]);

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [invoiceImage, setInvoiceImage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [pin, setPin] =
    useState("");

  const [isLogged, setIsLogged] =
    useState(false);

  const [role, setRole] =
    useState<"admin" | "empleado" | null>(null);
  const [inventoryView, setInventoryView] =
    useState<"jabones" | "racimos">(
      "jabones"
    );
  const [saleType, setSaleType] =
    useState<"jabones" | "racimos">(
      "jabones"
    );
  const isAdmin =
    role === "admin";

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const loginWithPin = () => {

    if (pin === "187276") {

      setRole("admin");
      setIsLogged(true);

      localStorage.setItem(
        "jeymood-role",
        "admin"
      );

    } else if (

      pin === "281018" ||
      pin === "792865"

    ) {

      setRole("empleado");
      setIsLogged(true);

      localStorage.setItem(
        "jeymood-role",
        "empleado"
      );

    } else {

      alert("PIN incorrecto");

    }

  };

  const syncFirebase = async (
    newInventory: any,
    newRacimoInventory: any,
    newSales: any
  ) => {

    await setDoc(
      doc(db, "jeymood", "data"),
      {
        inventory: newInventory,
        racimoInventory: newRacimoInventory,
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

            const mergedInventory =
              SOAPS.map((soap) => {

                const existing =
                  data.inventory?.find(
                    (i: any) =>
                      i.name === soap
                  );

                return existing || {
                  name: soap,
                  quantity: 0,
                  sold: 0
                };

              });

            setInventory(
              mergedInventory
            );
            const mergedRacimos =
              RACIMOS.map((item) => {

                const existing =
                  data.racimoInventory?.find(
                    (i: any) =>
                      i.name === item
                  );

                return existing || {
                  name: item,
                  quantity: 0,
                  sold: 0
                };

              });

            setRacimoInventory(
              mergedRacimos
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
  useEffect(() => {

    if (saleType === "jabones") {

      setSoap(SOAPS[0]);

    } else {

      setSoap(RACIMOS[0]);

    }

  }, [saleType]);
  useEffect(() => {

    if (saleType === "jabones") {

      setRacimoMixMode(false);
      setRacimoMixItems([]);

    }

    if (saleType === "racimos") {

      setWholesale(false);
      setPromoMode(false);
      setPromoMixItems([]);

    }

  }, [saleType]);
  const calculatePrice = (
    qty: number,
    wholesaleMode: boolean,
    promo: boolean
  ) => {

    // MAYORISTA MANUAL
    if (wholesaleMode) {

      return qty * 1.5;

    }

    // PROMOCIÓN MANUAL
    // para mezclar fragancias
    if (promo) {

      const promoPacks =
        Math.floor(qty / 3);

      const remaining =
        qty % 3;

      return (
        promoPacks * 5 +
        remaining * 2
      );

    }

    // AUTOMÁTICO MISMO JABÓN
    if (qty >= 10) {

      return qty * 1.5;

    }

    if (qty >= 3) {

      const promoPacks =
        Math.floor(qty / 3);

      const remaining =
        qty % 3;

      return (
        promoPacks * 5 +
        remaining * 2
      );

    }

    // NORMAL
    return qty * 2;

  };

  const addPromoMixItem = () => {

    if (promoMixItems.length >= 3) {
      return;
    }

    setPromoMixItems((prev) => [
      ...prev,
      soap
    ]);

  };

  const addToCart = () => {
    if (!customer.trim()) {
      alert(
        "Ingrese cliente"
      );
      return;
    }

    if (
      promoMode &&
      promoMixItems.length === 3
    ) {

      setCart((prev) => [
        ...prev,
        {
          soap:
            promoMixItems.join(", "),
          quantity: 3,
          subtotal: 5,
        },
      ]);

      setPromoMixItems([]);

      return;

    }
    if (
      racimoMixMode &&
      racimoMixItems.length === 3
    ) {

      setCart((prev) => [
        ...prev,
        {
          soap:
            "RACIMO DE UVAS: " +
            racimoMixItems.join(", "),
          quantity: 3,
          subtotal: 10,
        },
      ]);

      setRacimoMixItems([]);

      return;

    }
    let subtotal;

    if (saleType === "racimos") {

      subtotal =
        quantity * 4;

    } else {

      subtotal =
        calculatePrice(
          quantity,
          wholesale,
          promoMode
        );

    }
    setCart((prev) => [
      ...prev,
      {
        soap,
        quantity,
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
        7,
        "0"
      );

    const newSale: Sale = {
      id: Date.now(),
      type: saleType,
      customer,
      items: cart,
      total,
      date,
      time,
      invoiceNumber,
    };

    const updatedInventory =
      saleType === "jabones"
        ? [...inventory]
        : [...racimoInventory];

    cart.forEach((item) => {

      // PROMO MEZCLA
      if (
        item.soap.includes(",")
      ) {

        const soaps =
          item.soap.split(",");

        soaps.forEach(
          (soapName) => {

            const found =
              updatedInventory.find(
                (i) =>
                  i.name ===
                  soapName
                    .trim()
                    .replace(/\s+/g, " ")
                    .toUpperCase()
              );

            if (found) {

              found.quantity -= 1;

              found.sold += 1;

              if (
                found.quantity < 0
              ) {
                found.quantity = 0;
              }

            }

          }
        );

      } else {

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

      }

    });
    if (saleType === "jabones") {

      setInventory(
        updatedInventory
      );

    } else {

      setRacimoInventory(
        updatedInventory
      );

    }
    syncFirebase(
      saleType === "jabones"
        ? updatedInventory
        : inventory,

      saleType === "racimos"
        ? updatedInventory
        : racimoInventory,

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

    const logo =
      new Image();

    logo.src =
      logoImg;

    ctx.drawImage(
      logo,
      20,
      20,
      70,
      70
    );


    // TEXTO HEADER
    ctx.fillStyle =
      "#ffffff";

    ctx.font =
      "bold 34px Arial";

    ctx.fillText(
      "JEYMOOD",
      100,
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
        if (
          item.soap.includes(",")

        ) {


          ctx.fillStyle =
            "#ec4899";

          ctx.font =
            "bold 14px Arial";

          ctx.fillText(
            "PROMOCIÓN",
            20,
            y
          );

          ctx.fillStyle =
            "#111827";

          ctx.font =
            "14px Arial";

          ctx.fillText(
            `Cantidad: ${item.quantity}`,
            240,
            y
          );

          y += 40;

          const soaps =
            item.soap.split(",");

          ctx.fillStyle =
            "#111827";

          ctx.font =
            "13px Arial";

          soaps.forEach((soapName) => {

            ctx.fillText(
              `• ${soapName
                .trim()
                .toLowerCase()
                .replace(
                  /^./,
                  (c) => c.toUpperCase()
                )}`,
              40,
              y
            );

            y += 25;

          });

        } else {

          ctx.fillStyle =
            "#ec4899";

          ctx.font =
            "bold 16px Arial";

          ctx.fillText(
            item.soap,
            20,
            y
          );

        }

        ctx.fillStyle =
          "#111827";

        ctx.font =
          "14px Arial";

        if (
          !item.soap.includes(",")
        ) {

          ctx.fillText(
            `Cantidad: ${item.quantity}`,
            240,
            y
          );

        }

        ctx.fillText(
          `$${item.subtotal.toFixed(
            2
          )}`,
          360,
          item.soap.includes(",")
            ? y - 120
            : y
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

    if (
      inventoryView === "racimos"
    ) {

      setRacimoInventory(
        (prev) =>
          prev.map((item) =>
            item.name === name
              ? {
                ...item,
                quantity: value,
              }
              : item
          )
      );

    } else {

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

    }

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
      sale.type === "jabones"
        ? [...inventory]
        : [...racimoInventory];

    sale.items.forEach(
      (item) => {

        // PROMO MEZCLA
        if (
          item.soap.includes(",")
        ) {

          const soaps =
            item.soap.split(",");
          console.log(soaps);
          soaps.forEach(
            (soapName) => {

              const found =
                updatedInventory.find(
                  (i) =>
                    i.name ===
                    soapName
                      .trim()
                      .replace(/\s+/g, " ")
                      .toUpperCase()
                );

              if (found) {

                found.quantity += 1;

                found.sold -= 1;

                if (
                  found.sold < 0
                ) {
                  found.sold = 0;
                }

              }

            }
          );

        } else {

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

      }
    );

    if (sale.type === "jabones") {

      setInventory(
        updatedInventory
      );

    } else {

      setRacimoInventory(
        updatedInventory
      );

    }

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

      sale.type === "jabones"
        ? updatedInventory
        : inventory,

      sale.type === "racimos"
        ? updatedInventory
        : racimoInventory,

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
    (
      inventoryView === "jabones"
        ? inventory
        : racimoInventory
    ).reduce(
      (acc, item) =>
        acc + item.quantity,
      0
    );
  const resetSold = () => {

    if (!isAdmin) return;

    const updatedInventory =
      inventory.map((item) => ({
        ...item,
        sold: 0
      }));

    setInventory(
      updatedInventory
    );

syncFirebase(
  updatedInventory,
  racimoInventory,
  sales
);

  };
  const logout = () => {

    localStorage.removeItem(
      "jeymood-role"
    );

    setIsLogged(false);
    setRole(null);
    setPin("");

  };

  if (!isLogged) {

    return (

      <div className="min-h-screen bg-pink-100 flex items-center justify-center p-6">

        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md space-y-6">

          <h1 className="text-4xl font-black text-pink-600 text-center">
            JEYMOOD POS
          </h1>

          <p className="text-center text-gray-500 font-semibold">
            Ingresa tu PIN
          </p>

          <input
            type="password"
            placeholder="PIN"
            value={pin}
            onChange={(e) =>
              setPin(
                e.target.value
              )
            }
            className="w-full border-2 border-pink-200 rounded-2xl p-4 text-xl outline-none"
          />

          <button
            onClick={loginWithPin}
            className="w-full bg-pink-500 text-white rounded-2xl p-4 text-xl font-bold"
          >
            Entrar
          </button>

        </div>

      </div>

    );

  }

  return (
    <div className="min-h-screen bg-pink-50 text-gray-800 pb-20">
      <div className="p-4 flex justify-between items-center bg-white shadow rounded-2xl mb-4">

        {isLogged ? (

          <div className="flex items-center gap-3">

            <img
              src="https://i.imgur.com/HeIi0wU.png"
              className="w-10 h-10 rounded-full"
            />
            <div>

              <p className="font-bold">
                {role === "admin"
                  ? "Administrador"
                  : "Empleado"}
              </p>

            </div>

            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-xl"
            >
              Salir
            </button>

            <div>

              <div className="font-bold">
                {role === "admin"
                  ? "Administrador"
                  : "Empleado"}
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
            onClick={loginWithPin}
            className="bg-pink-500 text-white px-5 py-3 rounded-2xl font-bold"
          >
            Iniciar sesión
          </button>

        )}

        {isLogged && (

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
            <div className="flex gap-3">

              <button
                onClick={() =>
                  setSaleType("jabones")
                }
                className={`px-4 py-3 rounded-2xl font-bold ${saleType === "jabones"
                  ? "bg-pink-500 text-white"
                  : "bg-pink-100"
                  }`}
              >
                JABONES 🧼
              </button>

              <button
                onClick={() =>
                  setSaleType("racimos")
                }
                className={`px-4 py-3 rounded-2xl font-bold ${saleType === "racimos"
                  ? "bg-pink-500 text-white"
                  : "bg-pink-100"
                  }`}
              >
                RACIMOS 🍇
              </button>

            </div>
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

              {(saleType === "jabones"
                ? SOAPS
                : RACIMOS
              ).map((item) => (

                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>

              ))}

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
            />

            {saleType === "jabones" && (

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
                  Precio Mayorista ($1.50)
                </span>

              </label>

            )}

            {saleType === "jabones" && (

              <label className="flex items-center gap-3 bg-pink-50 p-4 rounded-2xl">

                <input
                  type="checkbox"
                  checked={promoMode}
                  onChange={(e) =>
                    setPromoMode(
                      e.target.checked
                    )
                  }
                />

                <span className="font-bold">
                  Promoción Mezcla 3x$5
                </span>

              </label>

            )}


            {saleType === "racimos" && (

              <label className="flex items-center gap-3 bg-pink-50 p-4 rounded-2xl">

                <input
                  type="checkbox"
                  checked={racimoMixMode}
                  onChange={(e) =>
                    setRacimoMixMode(
                      e.target.checked
                    )
                  }
                />

                <span className="font-bold">
                  Mezcla Racimo 3x$10
                </span>

              </label>

            )}

            {promoMode && (

              <div className="bg-pink-50 p-4 rounded-2xl space-y-3">

                <div className="font-black text-pink-600">
                  Promo Mezcla
                </div>

                <div className="text-sm">
                  Jabones agregados:
                </div>

                <div className="space-y-2">

                  {promoMixItems.map(
                    (item, index) => (

                      <div
                        key={index}
                        className="bg-white p-2 rounded-xl"
                      >
                        {item}
                      </div>

                    )
                  )}

                </div>

                <div className="font-bold">
                  {promoMixItems.length}/3
                </div>

                <button
                  onClick={addPromoMixItem}
                  className="w-full bg-pink-400 text-white p-3 rounded-2xl font-bold"
                >
                  Agregar a Promo
                </button>

              </div>

            )}
            {saleType === "racimos" && racimoMixMode && (

              <div className="bg-pink-50 p-4 rounded-2xl space-y-3">

                <div className="font-black text-pink-600">
                  Racimo Mezcla
                </div>

                <div className="text-sm">
                  Fragancias agregadas:
                </div>

                <div className="space-y-2">

                  {racimoMixItems.map(
                    (item, index) => (

                      <div
                        key={index}
                        className="bg-white p-2 rounded-xl"
                      >
                        {item}
                      </div>

                    )
                  )}

                </div>

                <div className="font-bold">
                  {racimoMixItems.length}/3
                </div>

                <button
                  onClick={() => {

                    if (
                      racimoMixItems.length >= 3
                    ) {
                      return;
                    }

                    setRacimoMixItems(
                      (prev) => [
                        ...prev,
                        soap
                      ]
                    );

                  }}
                  className="w-full bg-purple-500 text-white p-3 rounded-2xl font-bold"
                >
                  Agregar a Racimo
                </button>

              </div>

            )}
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

                        {wholesale
                          ? "Mayorista Manual"
                          : promoMode
                            ? "Promo Mezcla"
                            : item.quantity >= 10
                              ? "Mayorista"
                              : item.quantity >= 3
                                ? "Promoción 3x5"
                                : "Unidad"}
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
                onClick={async () => {

                  if (!canvasRef.current)
                    return;

                  const canvas =
                    canvasRef.current;

                  canvas.toBlob(
                    async (blob) => {

                      if (!blob) return;

                      const file =
                        new File(
                          [blob],
                          "factura-jeymood.png",
                          {
                            type: "image/png"
                          }
                        );

                      if (
                        navigator.share &&
                        navigator.canShare({
                          files: [file]
                        })
                      ) {

                        await navigator.share({

                          title:
                            "Factura JEYMOOD",

                          text:
                            "Hola 👋 aquí está tu factura JEYMOOD",

                          files: [file]

                        });

                      } else {

                        window.open(
                          `https://wa.me/?text=${encodeURIComponent(
                            "Hola 👋 aquí está tu factura JEYMOOD"
                          )}`,
                          "_blank"
                        );

                      }

                    },
                    "image/png"
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



        </div>
      )}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      {/* INVENTARIO */}
      {tab === "inventario" && (
        <div className="p-4">
          {isAdmin && (
            <button
              onClick={resetSold}
              className="mb-4 bg-red-500 text-white px-4 py-3 rounded-2xl font-bold"
            >
              Reiniciar Vendidos
            </button>
          )}
          <div className="flex gap-3 mb-4">

            <button
              onClick={() =>
                setInventoryView(
                  "jabones"
                )
              }
              className={`px-4 py-3 rounded-2xl font-bold ${inventoryView === "jabones"
                ? "bg-pink-500 text-white"
                : "bg-pink-100"
                }`}
            >
              JABONES 🧼
            </button>

            <button
              onClick={() =>
                setInventoryView(
                  "racimos"
                )
              }
              className={`px-4 py-3 rounded-2xl font-bold ${inventoryView === "racimos"
                ? "bg-pink-500 text-white"
                : "bg-pink-100"
                }`}
            >
              RACIMOS 🍇
            </button>

          </div>
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

            <table className="w-full text-sm">

              <thead className="bg-pink-500 text-white">

                <tr>

                  <th className="p-3">
                    {inventoryView === "jabones"
                      ? "Jabón"
                      : "Racimo"}
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

                {(
                  inventoryView === "jabones"
                    ? inventory
                    : racimoInventory
                ).map(
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
      {tab === "historial" && (
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
                  <button
                    onClick={() => {

                      createInvoiceImage(
                        sale
                      );

                      setTimeout(() => {

                        const link =
                          document.createElement(
                            "a"
                          );

                        link.href =
                          canvasRef.current!
                            .toDataURL(
                              "image/png"
                            );

                        link.download =
                          `Factura-${sale.invoiceNumber}.png`;

                        link.click();

                      }, 800);

                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold ml-2"
                  >
                    Descargar Factura
                  </button>
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