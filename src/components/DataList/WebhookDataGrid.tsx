import { Button, Stack } from '@mui/material';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useSnackPresistStore, useStorePresistStore, useUserPresistStore } from 'lib/store';
import { useEffect, useState } from 'react';
import axios from 'utils/http/axios';
import { Http } from 'utils/http/http';

type RowType = {
  id: number;
  webhookId: number;
  automaticRedelivery: number;
  enabled: number;
  eventType: number;
  payloadUrl: string;
  secret: string;
  status: number;
};

type GridType = {
  source: 'dashboard' | 'none';
  setIsWebhook: (value: boolean) => void;
  setPageStatus: (vakue: 'CREATE' | 'UPDATE') => void;
  setPayloadUrl: (value: string) => void;
  setSecret: (value: string) => void;
  setShowAutomaticRedelivery: (value: boolean) => void;
  setShowEnabled: (value: boolean) => void;
  setEventType: (value: number) => void;
  setModifyId: (value: number) => void;
};

export default function WebhookDataGrid(props: GridType) {
  const { source } = props;

  const [rows, setRows] = useState<RowType[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<RowType>();

  const { getStoreId } = useStorePresistStore((state) => state);
  const { getUserId } = useUserPresistStore((state) => state);
  const { setSnackSeverity, setSnackOpen, setSnackMessage } = useSnackPresistStore((state) => state);

  const onClickRow = async (e: RowType) => {
    setSelectedValue(e);
    setOpen(true);
  };

  const onClickTest = async (params: any) => {
    try {
      await axios.get(params.row.payloadUrl);

      setSnackSeverity('success');
      setSnackMessage('Testing successful!');
      setSnackOpen(true);
    } catch (e) {
      setSnackSeverity('error');
      setSnackMessage('Testing failed!');
      setSnackOpen(true);
      console.error(e);
    }
  };

  const onClickModify = async (params: any) => {
    if (params.row) {
      props.setModifyId(params.row.webhookId);
      props.setEventType(params.row.eventType);
      props.setPayloadUrl(params.row.payloadUrl);
      props.setSecret(params.row.secret);
      props.setShowAutomaticRedelivery(params.row.automaticRedelivery === 1 ? true : false);
      props.setShowEnabled(params.row.enabled === 1 ? true : false);
      props.setPageStatus('UPDATE');
      props.setIsWebhook(true);
    }
  };

  const onClickDelete = async (params: any) => {
    try {
      const response: any = await axios.put(Http.delete_webhook_setting_by_id, {
        id: params.row.webhookId,
        store_id: getStoreId(),
        user_id: getUserId(),
      });

      if (response.result) {
        setSnackSeverity('success');
        setSnackMessage('Delete successful!');
        setSnackOpen(true);

        await init();

        // if (ws && ws.length > 0) {
        //   setRows(ws);
        // } else {
        //   window.location.reload();
        // }
      } else {
        setSnackSeverity('error');
        setSnackMessage('Delete failed!');
        setSnackOpen(true);
      }
    } catch (e) {
      setSnackSeverity('error');
      setSnackMessage('The network error occurred. Please try again later.');
      setSnackOpen(true);
      console.error(e);
    }
  };

  const columns: GridColDef<(typeof rows)[number]>[] = [
    { field: 'id', headerName: 'ID', width: 50 },
    {
      field: 'status',
      headerName: 'Status',
      width: 200,
      valueGetter: (value, row) => (value === 1 ? 'TRUE' : 'FALSE'),
    },
    {
      field: 'payloadUrl',
      headerName: 'Url',
      width: 200,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      type: 'actions',
      width: 600,
      align: 'right',
      headerAlign: 'right',
      getActions: ({ row }) => {
        return [
          <>
            <Button
              onClick={() => {
                onClickTest(row);
              }}
            >
              Test
            </Button>
            <Button
              onClick={() => {
                onClickModify(row);
              }}
            >
              Modify
            </Button>
            <Button
              onClick={() => {
                onClickDelete(row);
              }}
            >
              Delete
            </Button>
          </>,
        ];
      },
    },
  ];

  const init = async () => {
    try {
      const response: any = await axios.get(Http.find_webhook_setting, {
        params: {
          store_id: getStoreId(),
          user_id: getUserId(),
        },
      });

      if (response.result) {
        if (response.data.length > 0) {
          let rt: RowType[] = [];
          response.data.forEach((item: any, index: number) => {
            rt.push({
              id: index + 1,
              webhookId: item.id,
              automaticRedelivery: item.automatic_redelivery,
              enabled: item.enabled,
              eventType: item.event_type,
              payloadUrl: item.payload_url,
              secret: item.secret,
              status: item.status,
            });
          });
          setRows(rt);
        } else {
          setRows([]);
        }
      } else {
        setSnackSeverity('error');
        setSnackMessage('Can not find the data on site!');
        setSnackOpen(true);
      }
    } catch (e) {
      setSnackSeverity('error');
      setSnackMessage('The network error occurred. Please try again later.');
      setSnackOpen(true);
      console.error(e);
    }
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        pageSizeOptions={[10]}
        onRowClick={(e: any) => {
          onClickRow(e.row);
        }}
        // checkboxSelection
        // disableRowSelectionOnClick
        hideFooter={source === 'dashboard' ? true : false}
        disableColumnMenu
      />
    </Box>
  );
}
