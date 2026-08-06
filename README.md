# ArtifactsInejoma 🚀

**ArtifactsInejoma** es una plataforma educativa interactiva diseñada para la creación, gestión y ejecución en tiempo real de artefactos de aprendizaje (código HTML, CSS y JavaScript) mediante sesiones dinámicas protegidas con códigos PIN de 4 dígitos.

Construida con una arquitectura de alto rendimiento basada en **Rust (Axum)** en el backend, **React (Vite)** en el frontend y **PostgreSQL** como motor de datos, la plataforma permite a los profesores monitorear la participación de sus alumnos en tiempo real a través de WebSockets y controlar el ciclo de vida de las sesiones interactivas.

---

## 🛠️ Tecnologías Utilizadas

* **Backend**: 
  * [Rust](https://www.rust-lang.org/) + [Axum](https://github.com/tokio-rs/axum) (Web Framework asíncrono sobre Tokio)
  * [SQLx](https://github.com/launchbadge/sqlx) (Driver asíncrono para PostgreSQL con migraciones en tiempo de compilación)
  * **Tokio WebSockets** (Sincronización bidireccional en tiempo real)
  * **JSON Web Tokens (JWT)** (Autenticación del Administrador/Profesor)
* **Frontend**:
  * [React](https://react.dev/) + [Vite](https://vitejs.dev/)
  * **HTML5 Sandboxed iFrames** (Aislamiento de seguridad para la ejecución de artefactos)
  * **WebSocket API Native Client**
* **Base de Datos**: 
  * [PostgreSQL](https://www.postgresql.org/)
* **Despliegue & Contenedores**: 
  * Docker & Docker Compose (Soporte Híbrido: Ejecución Nativa / Dockerizada)

---

## 📐 Arquitectura del Proyecto

El repositorio está organizado como un **Monorepo**:

```text
artifactsInejoma/
├── backend/                  # Proyecto Backend en Rust (Axum)
│   ├── src/
│   │   ├── config/           # Carga de variables de entorno (.env)
│   │   ├── db/               # Conexión SQLx y Seeder inicial
│   │   ├── handlers/         # Controladores (Auth, Grados, Asignaturas, Artefactos, Sesiones)
│   │   ├── models/           # Modelos de datos y estructuras de BD
│   │   ├── ws/               # Manejo de conexiones WebSockets y salas en tiempo real
│   │   └── main.rs           # Punto de entrada del servidor Axum
│   ├── migrations/           # Migraciones de base de datos SQLx
│   └── Cargo.toml
├── frontend/                 # Proyecto Frontend en React (Vite)
│   ├── src/
│   │   ├── components/       # Componentes reutilizables (PIN Form, iFrame Sandbox, etc.)
│   │   ├── pages/            # Páginas (Login Student /, Dashboard Admin, Editor Artefactos)
│   │   ├── services/         # Servicios API REST y cliente WebSocket
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml        # Orquestación de servicios para despliegue en servidor
├── Dockerfile.backend        # Dockerfile multi-stage para Axum
├── Dockerfile.frontend       # Dockerfile para servir React con Nginx
├── .env.example              # Plantilla de variables de entorno
└── README.md
```

---

## ⚙️ Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto basándote en la plantilla `.env.example`:

```env
# Configuración del Servidor Backend
PORT=8000
HOST=0.0.0.0
JWT_SECRET=super_secret_jwt_key_change_in_production

# Configuración de Base de Datos PostgreSQL (Desarrollo Local Nativo)
# Nota: En desarrollo local sin Docker se usa localhost. En servidor con Docker,
# docker-compose.yml administra las credenciales y el host de contenedor automáticamente.
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_password
POSTGRES_DB=artifacts_inejoma
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DATABASE_URL=postgres://postgres:postgres_password@localhost:5432/artifacts_inejoma

# Credenciales para el Seed del Administrador / Profesor
ADMIN_EMAIL=admin@inejoma.edu
ADMIN_PASSWORD=AdminPassword123!
ADMIN_NAME=Profesor Administrador

# Configuración del Frontend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

---

## 🚀 Guía de Ejecución

### Modo 1: Desarrollo Local Nativo (Sin Docker)

Este modo se utiliza para desarrollo activo sin necesidad de contenedores.

#### Requisitos Previos:
* Rust & Cargo (`rustup update`)
* Node.js (v18+) & `npm`
* Servidor PostgreSQL local activo

#### Pasos:

1. **Configurar la Base de Datos**:
   Asegúrate de que PostgreSQL se esté ejecutando y crea la base de datos:
   ```bash
   createdb -U postgres artifacts_inejoma
   ```

2. **Backend (Rust + Axum)**:
   ```bash
   cd backend
   # Instalar CLI de SQLx (si no lo tienes instalado)
   cargo install sqlx-cli --no-default-features --features postgres

   # Ejecutar migraciones y seed inicial
   sqlx migrate run

   # Iniciar el servidor backend en modo desarrollo
   cargo run
   ```
   *El servidor backend iniciará en `http://localhost:8000` y creará automáticamente el usuario Administrador si no existe.*

3. **Frontend (React + Vite)**:
   En otra terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *El servidor frontend estará disponible en `http://localhost:5173`.*

---

### Modo 2: Despliegue en Servidor Local (Con Docker)

Este modo se utiliza para desplegar la plataforma en el servidor local con Debian usando Docker y Docker Compose.

#### Requisitos Previos:
* Docker & Docker Compose plugin instalado en Debian.

#### Pasos:

1. **Construir e iniciar todos los servicios**:
   ```bash
   docker compose up --build -d
   ```

2. **Verificar el estado de los contenedores**:
   ```bash
   docker compose ps
   ```

3. **Ver logs de la aplicación**:
   ```bash
   docker compose logs -f
   ```

4. **Detener la aplicación**:
   ```bash
   docker compose down
   ```

---

## 👥 Funcionalidades y Flujos de Uso

### 🔐 1. Panel Administrador / Profesor

1. **Inicio de Sesión y Seeding**:
   * Al iniciar el servidor, el backend ejecuta un *seeder* que crea el usuario Administrador usando los valores de `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`.
   * El profesor inicia sesión en `/admin/login` para recibir un JWT.
2. **Gestión de Grados y Asignaturas (CRUD)**:
   * Crear, editar, listar y eliminar Grados (ej. *1° Secundaria*, *2° Bachillerato*).
   * Crear, editar, listar y eliminar Asignaturas (ej. *Matemáticas*, *Física*, *Programación*).
3. **Gestión de Artefactos (CRUD)**:
   * Crear artefactos educativos ingresando:
     * Título
     * Grado y Asignatura a la que pertenece
     * Código de la aplicación web (**HTML + CSS + JavaScript**)
   * Probar, editar o eliminar artefactos existentes.
4. **Sesión Interactiva en Tiempo Real (Play & Monitor)**:
   * Al presionar **Play** en un artefacto:
     * Se abre el artefacto en una nueva pestaña del navegador.
     * Se genera un **PIN único de 4 dígitos** (ej. `4829`).
     * Se inicia un canal WebSocket que muestra en **tiempo real** la cantidad de alumnos conectados a la sesión.
   * Al presionar **Finalizar Sesión**:
     * El PIN de 4 dígitos **muere/expira de inmediato**.
     * Se envía un evento WebSocket a todos los estudiantes conectados a esa sesión.
     * La próxima vez que se presione **Play** en el artefacto, se generará un **PIN de 4 dígitos completamente nuevo**.

---

### 🎓 2. Portal de Alumnos

1. **Ingreso mediante PIN (`/`)**:
   * Al entrar a la raíz de la URL (`/`), los estudiantes ven una interfaz limpia estilo login solicitando un **Código PIN de 4 dígitos**.
   * **PIN Incorrecto / Inexistente**: Muestra el mensaje *"El código PIN no existe o la sesión ha finalizado"*.
   * **PIN Correcto**: Redirige al alumno a la vista de interacción del artefacto.
2. **Ejecución Segura del Artefacto**:
   * El código HTML, CSS y JS se renderiza dentro de un `<iframe sandbox="allow-scripts allow-modals">` para garantizar la seguridad del navegador y aislar los estilos de la plataforma.
3. **Cierre de Sesión por el Profesor**:
   * Cuando el profesor presiona "Finalizar", la pantalla del estudiante muestra una notificación flotante:
     > 🛑 **La sesión ha sido finalizada por el profesor. Redireccionando en 5... 4... 3... 2... 1...**
   * Tras la cuenta regresiva de 5 segundos, el estudiante es redirigido automáticamente a la pantalla inicial `/`.

---

## 📡 Protocolo WebSockets (Eventos)

La comunicación en tiempo real entre el servidor Axum y los clientes se gestiona a través del endpoint `/ws`.

### Mensajes Servidor $\rightarrow$ Administrador (Profesor):
```json
{
  "event": "STUDENT_COUNT_UPDATE",
  "pin": "4829",
  "connected_students": 18
}
```

### Mensajes Servidor $\rightarrow$ Alumnos:
```json
{
  "event": "SESSION_ENDED",
  "message": "La sesión ha finalizado",
  "countdown_seconds": 5
}
```

---

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT.
