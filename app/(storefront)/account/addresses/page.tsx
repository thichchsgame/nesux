import { auth } from "@/lib/auth";
import { listAddresses } from "@/lib/addresses";
import { AddressManager } from "@/components/account/address-manager";

export default async function AccountAddressesPage() {
  const session = await auth();
  const list = await listAddresses(session!.user!.id!);

  const items = list.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    ward: a.ward,
    city: a.city,
    isDefault: a.isDefault,
  }));

  return <AddressManager initialAddresses={items} />;
}
