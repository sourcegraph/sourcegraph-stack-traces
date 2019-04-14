import * as sourcegraph from 'sourcegraph'
import { registerStackTraceParser } from './parser'

export function activate(ctx: sourcegraph.ExtensionContext): void {
    ctx.subscriptions.add(registerStackTraceParser())
}

export interface Settings {}
