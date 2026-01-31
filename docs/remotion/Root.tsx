import { Composition, registerRoot } from 'remotion';
import { ArchitectureVideo } from './compositions/Architecture';
import { QuickStartVideo } from './compositions/QuickStart';
import { WorkflowVideo } from './compositions/Workflow';

/**
 * Remotion Root - registers all video compositions
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="QuickStart"
        component={QuickStartVideo}
        durationInFrames={4500}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Workflow"
        component={WorkflowVideo}
        durationInFrames={7200}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Architecture"
        component={ArchitectureVideo}
        durationInFrames={10800}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(RemotionRoot);
