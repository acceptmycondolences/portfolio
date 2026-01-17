import { useState } from 'react'

import * as PopoverPrimitive from '@radix-ui/react-popover'

import { Navbar } from '~/widgets/navbar'

import { IconMenu } from '~/shared/ui'

export function Menu() {
  const [open, setOpen] = useState(false)

  return (
    <PopoverPrimitive.Root onOpenChange={setOpen} open={open}>
      <PopoverPrimitive.Trigger
        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-slate-600 hover:text-orange-50 [&_svg]:pointer-events-none [&_svg]:shrink-0"
        type="button"
      >
        <IconMenu />
        <span className="sr-only">Toggle menu</span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          className="z-50 max-h-(--radix-popover-content-available-height) w-56 origin-(--radix-popover-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-zinc-400 bg-slate-600 py-2 text-orange-50 shadow-md focus:border-zinc-400 focus:ring-0 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          sideOffset={8}
        >
          <Navbar
            onClose={() => {
              setOpen(false)
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
