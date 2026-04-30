interface GroupNodeData {
  label: string
  color: string
  memberIds: string[]
}

export function GroupNode({ data }: { data: GroupNodeData }) {
  return (
    <div
      className="rounded-2xl border-2 border-dashed w-full h-full relative pointer-events-none"
      style={{
        borderColor: `${data.color}60`,
        backgroundColor: `${data.color}08`,
      }}
    >
      <span
        className="absolute top-2.5 left-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full select-none pointer-events-none"
        style={{ color: data.color, backgroundColor: `${data.color}18` }}
      >
        {data.label}
      </span>
    </div>
  )
}
