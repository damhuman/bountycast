import { BountyCreationForm } from '@/components/BountyCreationForm'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import Link from 'next/link'

export default function CreateBountyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🎯</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CastBounty
            </h1>
          </Link>
          <ConnectWallet />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <BountyCreationForm />
      </main>
    </div>
  )
}
