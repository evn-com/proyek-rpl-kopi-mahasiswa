# Kopi Mahasiswa ☕

A modern coffee shop ordering, POS, and store management web application built with **Next.js 14**, **Prisma ORM**, **Tailwind CSS**, and **TypeScript**.

## Features

- 📱 **Customer Ordering**: Clean digital menu with variants, topping customization, and responsive cart.
- 💳 **Payment & Order Status**: Order tracking and payment simulation workflow.
- 🧑‍🍳 **Kitchen / Barista View**: Real-time incoming order tickets for kitchen and baristas.
- 📊 **Cashier & Admin Dashboard**: POS management, product and inventory management, vouchers, and reporting.
- 🔐 **Role-based Authentication**: Roles for Customer, Cashier, Barista, Admin, and Owner.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database ORM**: [Prisma](https://www.prisma.io/) (SQLite default)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Authentication**: JWT / Bcrypt

## Getting Started

### 1. Prerequisites

- Node.js 18+ installed

### 2. Installation

```bash
# Clone repository
git clone <your-repo-url>
cd kopi-mahasiswa

# Install dependencies
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 4. Database Setup

```bash
# Push Prisma schema to SQLite
npm run db:push

# (Optional) Seed initial data
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
