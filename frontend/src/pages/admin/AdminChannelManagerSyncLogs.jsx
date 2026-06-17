import ChannelManagerSyncLogsTable from "../../components/shared/ChannelManagerSyncLogsTable";

const AdminChannelManagerSyncLogs = () => {
  return (
    <div className="p-6">
      <ChannelManagerSyncLogsTable
        title="Stayflexi Sync Logs"
        description="Monitor inbound and outbound Stayflexi integration events across vendors"
        listEndpoint="/admin/channel-manager/sync-logs"
        detailEndpointBuilder={(id) => `/admin/channel-manager/sync-logs/${id}`}
        replayEndpointBuilder={(id) =>
          `/admin/channel-manager/sync-logs/${id}/replay`
        }
      />
    </div>
  );
};

export default AdminChannelManagerSyncLogs;
