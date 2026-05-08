import * as sourcegraph from 'sourcegraph'

const ANNOTATED = `
<pre><code>
<strong><a href="https://sourcegraph.com/github.com/sourcegraph/sourcegraph/-/blob/pkg/trace/httptrace.go#L182:1">*trace.httpErr</a></strong>: HTTP status 500, GET <strong><a href="https://sourcegraph.com/go/github.com/hyperledger/fabric/-/ChaincodeStub/GetStateByRange">/go/github.com/hyperledger/fabric/-/ChaincodeStub/GetStateByRange</a></strong>
  File "/buildkite/builds/buildkite-agent-59b9b57b47-xdl42-1/sourcegraph/.golang/sourcegraph/src/<strong><a href="https://sourcegraph.com/github.com/sourcegraph/sourcegraph/-/blob/pkg/trace/httptrace.go#L143">github.com/sourcegraph/sourcegraph/pkg/trace/httptrace.go</a></strong>", line 143, in func1
  File "<strong><a href="https://sourcegraph.com/github.com/golang/go@go1.11/-/blob/src/net/http/server.go#L1995">/usr/local/go/src/net/http/server.go</a></strong>", line 1995, in ServeHTTP
  File "/buildkite/builds/buildkite-agent-59b9b57b47-xdl42-1/sourcegraph/.golang/sourcegraph/src/<strong><a href="https://sourcegraph.com/github.com/sourcegraph/sourcegraph/-/blob/cmd/frontend/internal/cli/middleware/goimportpath.go#L48">github.com/sourcegraph/sourcegraph/cmd/frontend/internal/cli/middleware/goimportpath.go</a></strong>", line 48, in func1
  File "<strong><a href="https://sourcegraph.com/github.com/golang/go@go1.11/-/blob/src/net/http/server.go#L1995">/usr/local/go/src/net/http/server.go</a></strong>", line 1995, in ServeHTTP
  File "/buildkite/builds/buildkite-agent-59b9b57b47-xdl42-1/sourcegraph/.golang/sourcegraph/src/<strong><a href="https://sourcegraph.com/github.com/sourcegraph/sourcegraph/-/blob/cmd/frontend/internal/cli/middleware/blackhole.go#L17">github.com/sourcegraph/sourcegraph/cmd/frontend/internal/cli/middleware/blackhole.go</a></strong>", line 17, in func1
  File "<strong><a href="https://sourcegraph.com/github.com/golang/go@go1.11/-/blob/src/net/http/server.go#L1995">/usr/local/go/src/net/http/server.go</a></strong>", line 1995, in ServeHTTP
  File "/buildkite/builds/buildkite-agent-59b9b57b47-xdl42-1/sourcegraph/.golang/sourcegraph/src/<strong><a href="https://sourcegraph.com/github.com/sourcegraph/sourcegraph/-/blob/cmd/frontend/internal/cli/http.go#L157">github.com/sourcegraph/sourcegraph/cmd/frontend/internal/cli/http.go</a></strong>", line 157, in func1
  File "<strong><a href="https://sourcegraph.com/github.com/golang/go@go1.11/-/blob/src/net/http/server.go#L1995">/usr/local/go/src/net/http/server.go</a></strong>", line 1995, in ServeHTTP
  File "/buildkite/builds/buildkite-agent-59b9b57b47-xdl42-1/sourcegraph/.golang/sourcegraph/src/<strong><a href="https://sourcegraph.com/github.com/sourcegraph/sourcegraph/-/blob/cmd/frontend/internal/cli/http.go#L85">github.com/sourcegraph/sourcegraph/cmd/frontend/internal/cli/http.go</a></strong>", line 85, in func1
  File "<strong><a href="https://sourcegraph.com/github.com/golang/go@go1.11/-/blob/src/net/http/server.go#L1995">/usr/local/go/src/net/http/server.go</a></strong>", line 1995, in ServeHTTP
  File "/buildkite/builds/buildkite-agent-59b9b57b47-xdl42-1/sourcegraph/.golang/sourcegraph/pkg/<strong><a href="https://sourcegraph.com/github.com/gorilla/context@v1.1.1/-/blob/context.go#L141">mod/github.com/gorilla/context@v1.1.1/context.go</a></strong>", line 141, in func1
  File "<strong><a href="https://sourcegraph.com/github.com/golang/go@go1.11/-/blob/src/net/http/server.go#L1995">/usr/local/go/src/net/http/server.go</a></strong>", line 1995, in ServeHTTP
  File "/buildkite/builds/buildkite-agent-59b9b57b47-xdl42-1/sourcegraph/.golang/sourcegraph/src/<strong><a href="https://sourcegraph.com/github.com/sourcegraph/sourcegraph/-/blob/cmd/frontend/internal/cli/middleware/trace.go#L27">github.com/sourcegraph/sourcegraph/cmd/frontend/internal/cli/middleware/trace.go</a></strong>", line 27, in func1
  File "<strong><a href="https://sourcegraph.com/github.com/golang/go@go1.11/-/blob/src/net/http/server.go#L1995">/usr/local/go/src/net/http/server.go</a></strong>", line 1995, in ServeHTTP
  File "<strong><a href="https://sourcegraph.com/github.com/golang/go@go1.11/-/blob/src/net/http/server.go#L2774">/usr/local/go/src/net/http/server.go</a></strong>", line 2774, in ServeHTTP
  File "<strong><a href="https://sourcegraph.com/github.com/golang/go@go1.11/-/blob/src/net/http/server.go#L1878">/usr/local/go/src/net/http/server.go</a></strong>", line 1878, in serve
</code></pre>`

export function registerStackTraceParser(): sourcegraph.Unsubscribable {
    const panelView = sourcegraph.app.createPanelView('snippet.output')
    panelView.title = 'Stack trace'
    panelView.content =
        'Paste in a stack trace to explore it (with clickable links to the locations in your code files).'

    let activeViewComponentSubscription: sourcegraph.Unsubscribable | undefined
    let selectionSubscription: sourcegraph.Unsubscribable | undefined

    const unsubscribeSelection = (): void => {
        if (selectionSubscription) {
            selectionSubscription.unsubscribe()
            selectionSubscription = undefined
        }
    }

    const unsubscribeActiveViewComponent = (): void => {
        unsubscribeSelection()
        if (activeViewComponentSubscription) {
            activeViewComponentSubscription.unsubscribe()
            activeViewComponentSubscription = undefined
        }
    }

    const activeWindowSubscription = sourcegraph.app.activeWindowChanges.subscribe(activeWindow => {
        unsubscribeActiveViewComponent()

        if (!activeWindow) {
            return
        }

        activeViewComponentSubscription = activeWindow.activeViewComponentChanges.subscribe(editor => {
            unsubscribeSelection()

            if (!editor) {
                return
            }

            selectionSubscription = editor.selectionsChanges.subscribe(() => {
                if (editor.document.text) {
                    panelView.content = ANNOTATED
                }
            })
        })
    })

    return {
        unsubscribe: (): void => {
            unsubscribeActiveViewComponent()
            activeWindowSubscription.unsubscribe()
        },
    }
}
