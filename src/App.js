import './App.css';
import DnDFlow from './reactFlowPlayground';
import 'reactflow/dist/base.css';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  useReactFlow
} from 'reactflow';

function App() {
  return (
    <div className="App">
      <ReactFlowProvider>
        <DnDFlow />
      </ReactFlowProvider>
    </div>
  );
}

export default App;
