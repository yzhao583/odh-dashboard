import * as React from 'react';
import {
  Alert,
  Button,
  ButtonVariant,
  DrawerPanelBody,
  DrawerHead,
  DrawerPanelContent,
  DrawerActions,
  DrawerCloseButton,
  Tooltip,
  Text,
  TextContent,
  ActionList,
  ActionListItem,
  Divider,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { OdhApplication } from '~/types';
import MarkdownView from '~/components/MarkdownView';
import { markdownConverter } from '~/utilities/markdown';
import { useAppContext } from '~/app/AppContext';
import { fireMiscTrackingEvent } from '~/concepts/analyticsTracking/segmentIOUtils';
import { isObject, isString } from 'lodash-es';

const DEFAULT_BETA_TEXT =
  'This application is available for early access prior to official ' +
  ' release. It won’t appear in the *Enabled* view, but you can access it by' +
  ' [signing up for beta access.](https://www.starburst.io/platform/starburst-galaxy/).';

type GetStartedPanelProps = {
  selectedApp?: OdhApplication;
  onClose: () => void;
  onEnable: () => void;
};

const GetStartedPanel: React.FC<GetStartedPanelProps> = ({ selectedApp, onClose, onEnable }) => {
  const { dashboardConfig } = useAppContext();
  const { enablement } = dashboardConfig.spec.dashboardConfig;
  const [isEnableButtonDisabled, setIsEnableButtonDisabled] = React.useState(false);
  const [isEnableButtonHidden, setIsEnableButtonHidden] = React.useState(false);

  React.useEffect(() => {
    if (selectedApp?.spec?.internalRoute !== undefined) {
      fetch(selectedApp.spec?.internalRoute).then((response) => {
        if (response.status === 404) {
          setIsEnableButtonDisabled(true);
        }
        setIsEnableButtonHidden(false);
        return response.json();
      }).then((data) => {
        if (isObject(data) && (data as Error).message === undefined) {
          setIsEnableButtonHidden(true);
        }
      }).catch((error) => { console.error(error); });
    }
  }, [selectedApp]);

  if (!selectedApp) {
    return null;
  }

  const renderEnableButton = () => {
    if (!selectedApp.spec.enable || selectedApp.spec.isEnabled || isEnableButtonHidden) {
      return null;
    }
    const button = (
      <Button variant={ButtonVariant.secondary} onClick={onEnable} isDisabled={!enablement || isEnableButtonDisabled}>
        Enable
      </Button>
    );
    if (enablement) {
      return button;
    }
    return (
      <Tooltip content="This feature has been disabled by an administrator.">
        <span>{button}</span>
      </Tooltip>
    );
  };

  return (
    <DrawerPanelContent
      data-testid="explore-drawer-panel"
      className="odh-get-started"
      isResizable
      minSize="350px"
    >
      <DrawerHead>
        <TextContent>
          <Text component="h2" style={{ marginBottom: 0 }}>
            {selectedApp.spec.displayName}
          </Text>
          {selectedApp.spec.provider ? (
            <Text component="small">by {selectedApp.spec.provider}</Text>
          ) : null}
        </TextContent>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      {selectedApp.spec.getStartedLink && (
        <DrawerPanelBody>
          <ActionList>
            <ActionListItem>
              <Button
                icon={<ExternalLinkAltIcon />}
                onClick={() =>
                  fireMiscTrackingEvent('Explore card get started clicked', {
                    name: selectedApp.metadata.name,
                  })
                }
                iconPosition="right"
                href={selectedApp.spec.getStartedLink}
                target="_blank"
                rel="noopener noreferrer"
                component="a"
              >
                Get started
              </Button>
            </ActionListItem>
            <ActionListItem>{renderEnableButton()}</ActionListItem>
          </ActionList>
        </DrawerPanelBody>
      )}
      <Divider />
      <DrawerPanelBody style={{ paddingTop: 0 }}>
        {selectedApp.spec.beta ? (
          <Alert
            variantLabel="error"
            variant="info"
            title={
              selectedApp.spec.betaTitle || `${selectedApp.spec.displayName} is currently in beta.`
            }
            aria-live="polite"
            isInline
          >
            <div
              dangerouslySetInnerHTML={{
                __html: markdownConverter.makeHtml(selectedApp.spec.betaText || DEFAULT_BETA_TEXT),
              }}
            />
          </Alert>
        ) : null}
        <MarkdownView markdown={selectedApp.spec.getStartedMarkDown} />
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default GetStartedPanel;
