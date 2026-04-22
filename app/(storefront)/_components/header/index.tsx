import { HeaderClient } from "./header-client"
import TopBar from "./top-bar"
import { type HeaderUser } from "./types"

type HeaderProps = {
  user?: HeaderUser
}

function Header({ user }: HeaderProps) {
  return (
    <>
      {user?.role === "admin" ? <TopBar /> : null}
      <HeaderClient user={user} />
    </>
  )
}

export default Header
