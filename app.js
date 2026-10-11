const botones = document.querySelectorAll("nav button");
const pantallas = document.querySelectorAll(".pantalla");

function mostrarPantalla(nombre) {
  pantallas.forEach(function (p) {
    p.classList.remove("activa");
  });
  botones.forEach(function (b) {
    b.classList.remove("activa");
  });

  document.getElementById("pantalla-" + nombre).classList.add("activa");
  document.querySelector('nav button[data-pantalla="' + nombre + '"]').classList.add("activa");
}

botones.forEach(function (b) {
  b.addEventListener("click", function () {
    mostrarPantalla(b.dataset.pantalla);
  });
});
let productos = JSON.parse(localStorage.getItem("productos")) || [];

function guardar() {
  localStorage.setItem("productos", JSON.stringify(productos));
}

function renderProductos() {
  const lista = document.getElementById("lista-productos");
  lista.innerHTML = "";
  productos.forEach(function (p) {
    const li = document.createElement("li");

    const texto = document.createElement("span");
    texto.textContent = p.nombre + " - $" + p.precio + " - Cant: " + p.stock;

    const btn = document.createElement("button");
    btn.textContent = "Borrar";
    btn.className = "borrar";
    btn.addEventListener("click", function () {
      borrarProducto(p.id);
    });

    li.appendChild(texto);
    li.appendChild(btn);
    lista.appendChild(li);
  });
    llenarSelect();
}

function borrarProducto(id) {
  if (!confirm("¿Borrar este producto?")) return;
  productos = productos.filter(function (p) {
    return p.id !== id;
  });
  guardar();
  renderProductos();
}
function ajustarStock(items, signo) {
  items.forEach(function (it) {
    const prod = productos.find(function (p) {
      return p.nombre === it.nombre;
    });
    if (prod) {
      prod.stock += signo * it.cantidad;
    }
  });
  guardar();
  renderProductos();
}

document.getElementById("form-producto").addEventListener("submit", function (e) {
  e.preventDefault();
  productos.push({
    id: Date.now(),
    nombre: document.getElementById("p-nombre").value.trim(),
    precio: Number(document.getElementById("p-precio").value),
    stock: Number(document.getElementById("p-stock").value)
  });
  guardar();
  renderProductos();
  e.target.reset();
});

renderProductos();
let itemsPedido = [];

function llenarSelect() {
  const sel = document.getElementById("ped-producto");
  sel.innerHTML = "";
  productos.forEach(function (p) {
    const op = document.createElement("option");
    op.value = p.id;
    op.textContent = p.nombre + " ($" + p.precio + ")";
    sel.appendChild(op);
  });
}

function renderItems() {
  const lista = document.getElementById("lista-items");
  lista.innerHTML = "";
  let total = 0;
  itemsPedido.forEach(function (it) {
    const li = document.createElement("li");
    li.textContent = it.cantidad + " x " + it.nombre + " = $" + (it.cantidad * it.precio);
    lista.appendChild(li);
    total += it.cantidad * it.precio;
  });
  document.getElementById("ped-total").textContent = "Total: $" + total;
}

document.getElementById("btn-agregar-item").addEventListener("click", function () {
  const id = Number(document.getElementById("ped-producto").value);
  const cantidad = Number(document.getElementById("ped-cantidad").value);
  const prod = productos.find(function (p) {
    return p.id === id;
  });
  if (!prod || cantidad < 1) return;
  itemsPedido.push({ nombre: prod.nombre, precio: prod.precio, cantidad: cantidad });
  renderItems();
});

llenarSelect();
renderItems();
let pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];

function guardarPedidos() {
  localStorage.setItem("pedidos", JSON.stringify(pedidos));
}

const siguienteEstado = {
  pendiente: "preparando",
  preparando: "entregado"
};

function renderPedidos() {
  const lista = document.getElementById("lista-pedidos");
  lista.innerHTML = "";
  pedidos.forEach(function (ped) {
    const li = document.createElement("li");

    const texto = document.createElement("span");
    texto.textContent = ped.cliente + " - $" + ped.total + " - " + ped.estado;
    li.appendChild(texto);

    if (siguienteEstado[ped.estado]) {
      const btn = document.createElement("button");
      btn.textContent = "Pasar a " + siguienteEstado[ped.estado];
      btn.className = "estado";
      btn.addEventListener("click", function () {
        cambiarEstado(ped.id, siguienteEstado[ped.estado]);
      });
      li.appendChild(btn);

      const cancelar = document.createElement("button");
      cancelar.textContent = "Cancelar";
      cancelar.className = "borrar";
      cancelar.addEventListener("click", function () {
        cambiarEstado(ped.id, "cancelado");
      });
      li.appendChild(cancelar);
    }

    lista.appendChild(li);
  });
}

function cambiarEstado(id, nuevo) {
  const ped = pedidos.find(function (p) {
    return p.id === id;
  });
    if (nuevo === "cancelado") {
    ajustarStock(ped.items, 1);
    }
  ped.estado = nuevo;
  guardarPedidos();
  renderPedidos();
  renderResumen();
}

document.getElementById("btn-guardar-pedido").addEventListener("click", function () {
  const cliente = document.getElementById("ped-cliente").value.trim();
  if (cliente === "" || itemsPedido.length === 0) {
    alert("Escribe el cliente y agrega al menos un producto");
    return;
  }
  let total = 0;
  itemsPedido.forEach(function (it) {
    total += it.cantidad * it.precio;
  });
    for (const it of itemsPedido) {
    const prod = productos.find(function (p) {
      return p.nombre === it.nombre;
    });
    if (!prod || prod.stock < it.cantidad) {
      alert("No hay stock suficiente de " + it.nombre);
      return;
    }
    }
  pedidos.push({
    id: Date.now(),
    fecha: new Date().toLocaleDateString(),
    cliente: cliente,
    estado: "pendiente",
    total: total,
    items: itemsPedido
  });
  guardarPedidos();
    ajustarStock(itemsPedido, -1);
  itemsPedido = [];
  document.getElementById("ped-cliente").value = "";
  renderItems();
  renderPedidos();
  renderResumen();
});

renderPedidos();
function renderResumen() {
  const cont = document.getElementById("resumen-contenido");
  let vendido = 0;
  const porEstado = { pendiente: 0, preparando: 0, entregado: 0, cancelado: 0 };
  const conteo = {};

  pedidos.forEach(function (ped) {
    porEstado[ped.estado]++;
    if (ped.estado === "entregado") {
      vendido += ped.total;
      ped.items.forEach(function (it) {
        conteo[it.nombre] = (conteo[it.nombre] || 0) + it.cantidad;
      });
    }
  });

  let top = "Aún no hay ventas";
  let max = 0;
  for (const nombre in conteo) {
    if (conteo[nombre] > max) {
      max = conteo[nombre];
      top = nombre + " (" + max + " unidades)";
    }
  }

  cont.innerHTML =
    '<div class="tarjeta"><div>Total vendido</div><div class="grande">$' + vendido + "</div></div>" +
    '<div class="tarjeta"><div>Producto más vendido</div><div class="grande">' + top + "</div></div>" +
    '<div class="tarjeta">' +
    "Pendientes: " + porEstado.pendiente + "<br>" +
    "Preparando: " + porEstado.preparando + "<br>" +
    "Entregados: " + porEstado.entregado + "<br>" +
    "Cancelados: " + porEstado.cancelado +
    "</div>";
}

renderResumen();
document.getElementById("btn-exportar").addEventListener("click", function () {
  const datos = JSON.stringify({ productos: productos, pedidos: pedidos });
  const nombre = "copia-dinoshop-" + new Date().toISOString().slice(0, 10) + ".json";
  const archivo = new File([datos], nombre, { type: "application/json" });
  if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
    navigator.share({ files: [archivo], title: "Copia DinoShop" }).catch(function () {});
    return;
  }
  const url = URL.createObjectURL(new Blob([datos], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("btn-importar").addEventListener("click", function () {
  document.getElementById("archivo-importar").click();
});

document.getElementById("archivo-importar").addEventListener("change", function (e) {
  const archivo = e.target.files[0];
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = function () {
    try {
      const datos = JSON.parse(lector.result);
      if (!Array.isArray(datos.productos) || !Array.isArray(datos.pedidos)) {
        alert("Este archivo no es una copia válida");
        return;
      }
      if (!confirm("Esto reemplaza tus datos actuales. ¿Continuar?")) return;
      productos = datos.productos;
      pedidos = datos.pedidos;
      guardar();
      guardarPedidos();
      renderProductos();
      renderPedidos();
      renderResumen();
      alert("Copia restaurada");
    } catch (err) {
      alert("No se pudo leer el archivo");
    }
  };
  lector.readAsText(archivo);
  e.target.value = "";
});
document.getElementById("btn-reporte").addEventListener("click", function () {
  let vendido = 0;
  let filas = "";
  pedidos.forEach(function (p) {
    if (p.estado === "entregado") vendido += p.total;
    filas += "<tr><td>" + p.fecha + "</td><td>" + p.cliente + "</td><td>" + p.estado + "</td><td>$" + p.total + "</td></tr>";
  });
  let inv = "";
  productos.forEach(function (p) {
    inv += "<tr><td>" + p.nombre + "</td><td>$" + p.precio + "</td><td>" + p.stock + "</td></tr>";
  });
  document.getElementById("reporte").innerHTML =
    "<h2>Reporte DinoShop</h2>" +
    "<p>Fecha: " + new Date().toLocaleDateString() + "</p>" +
    "<p><b>Total vendido: $" + vendido + "</b></p>" +
    "<h3>Pedidos</h3><table><tr><th>Fecha</th><th>Cliente</th><th>Estado</th><th>Total</th></tr>" + filas + "</table>" +
    "<h3>Inventario</h3><table><tr><th>Producto</th><th>Precio</th><th>Cantidad</th></tr>" + inv + "</table>";
  window.print();
});
document.getElementById("btn-reiniciar").addEventListener("click", function () {
  const aviso = "Antes de borrar, te recomiendo tocar 'Guardar copia'.\n\n";
  if (confirm(aviso + "¿Borrar SOLO los pedidos? (los productos se quedan)")) {
    pedidos = [];
    guardarPedidos();
    renderPedidos();
    renderResumen();
    alert("Pedidos borrados");
    return;
  }
  if (confirm("¿Borrar TODO (productos y pedidos)? No se puede deshacer.")) {
    productos = [];
    pedidos = [];
    guardar();
    guardarPedidos();
    renderProductos();
    renderPedidos();
    renderResumen();
    alert("Todo borrado");
  }
});