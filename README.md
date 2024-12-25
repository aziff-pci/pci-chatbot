<a href="https://princeton.com">
  <img alt="Princeton Consultants Internal Chatbot" src="app/(chat)/pci-logo-wide.png">
  <h1 align="center">PCIChat</h1>
</a>

<p align="center">
  Princeton Consultants' Internal Chatbot - A fully customizable private & secure LLM chatbot based on a <a href="https://github.com/vercel/ai-chatbot">template by Vercel</a>.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports OpenAI (default), Anthropic, Cohere, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Vercel Postgres powered by Neon](https://vercel.com/storage/postgres) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [NextAuth.js](https://github.com/nextauthjs/next-auth)
  - Simple and secure authentication

## Model Providers

This template ships with OpenAI `gpt-4o` as the default. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET,OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI%20Chatbot&demo-description=An%20Open-Source%20AI%20Chatbot%20Template%20Built%20With%20Next.js%20and%20the%20AI%20SDK%20by%20Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&stores=[{%22type%22:%22postgres%22},{%22type%22:%22blob%22}])

## Running locally

This project uses pnpm as its package manager and Vercel Environment Variables for configuration. 

### Installing pnpm

This project uses pnpm instead of npm because it's significantly faster and more efficient with disk space. pnpm uses a content-addressable store for all packages, meaning each unique version of a package is stored only once on your disk.

1. Install pnpm globally:
```bash
npm install -g pnpm
```

You can verify the installation with:
```bash
pnpm --version
```

### Setting up environment variables

1. Install Vercel CLI:
```bash
pnpm install -g vercel
```

2. Link your local instance to our Vercel project:
```bash
vercel link
```

3. Pull the environment variables:
```bash
vercel env pull
```

This will automatically create a `.env.local` file with all the necessary environment variables from our Vercel project. The file is automatically added to `.gitignore` to ensure sensitive information isn't committed to the repository.

### Starting the development server

Once you have pnpm installed and your environment variables set up, you can start the development server:

```bash
pnpm install
pnpm dev
```

The app should now be running on [localhost:3000](http://localhost:3000/).
