import ChannelManagerSyncLogsTable from "../../components/shared/ChannelManagerSyncLogsTable";

const VendorChannelManagerSyncLogs = () => {
  return (
    <div className="space-y-6 p-6">
      <ChannelManagerSyncLogsTable
        title="Stayflexi Sync Logs"
        description="Track sync activity for your mapped Stayflexi properties"
        listEndpoint="/vendor/channel-manager/sync-logs"
        detailEndpointBuilder={(id) =>
          `/vendor/channel-manager/sync-logs/${id}`
        }
      />
    </div>
  );
};

export default VendorChannelManagerSyncLogs;
