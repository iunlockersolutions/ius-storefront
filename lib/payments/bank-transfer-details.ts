import { db } from "@/lib/db"
import { siteSettings } from "@/lib/db/schema"

export interface BankTransferDetails {
  bankName: string
  branchName: string
  accountName: string
  accountNumber: string
}

const DEFAULT_BANK_TRANSFER_DETAILS: BankTransferDetails = {
  bankName: "Commercial Bank of Ceylon",
  branchName: "Colombo Main",
  accountName: "IUS Shop Pvt Ltd",
  accountNumber: "1234567890",
}

export function resolveBankTransferDetails(
  settings?: Record<string, string>,
): BankTransferDetails {
  return {
    bankName:
      settings?.bank_name?.trim() || DEFAULT_BANK_TRANSFER_DETAILS.bankName,
    branchName:
      settings?.bank_branch?.trim() || DEFAULT_BANK_TRANSFER_DETAILS.branchName,
    accountName:
      settings?.bank_account_name?.trim() ||
      DEFAULT_BANK_TRANSFER_DETAILS.accountName,
    accountNumber:
      settings?.bank_account_number?.trim() ||
      DEFAULT_BANK_TRANSFER_DETAILS.accountNumber,
  }
}

export async function getBankTransferDetails(): Promise<BankTransferDetails> {
  const settingsRows = await db.select().from(siteSettings)
  const settings = Object.fromEntries(
    settingsRows.map((setting) => [setting.key, setting.value]),
  )

  return resolveBankTransferDetails(settings)
}
