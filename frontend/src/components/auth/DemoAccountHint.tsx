// Shown on the login pages while the site runs on the browser mock data.
// TODO (backend): delete this component once real accounts exist.
export default function DemoAccountHint({ email, password }: { email: string; password: string }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-3 text-body-sm text-secondary">
      <span className="font-semibold text-primary">Demo account:</span> {email} / {password}
    </div>
  )
}
