import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const Roles = () => {
  return (
    <Box>
      <Box>
        <Stack direction={'row'} justifyContent={'space-between'}>
          <Typography variant="h6">Roles</Typography>
          <Button variant={'contained'} size="large">
            Add Roles
          </Button>
        </Stack>
      </Box>

      <Box mt={5}>
        <StoreRoles />
      </Box>
    </Box>
  );
};

export default Roles;

function createData(id: number, role: string, scope: string, permissions: string[], inUse: boolean) {
  return { id, role, scope, permissions, inUse };
}

const rows = [
  createData(1, 'Owner[Default]', 'Server-wide', ['A', 'B', 'C'], true),
  createData(2, 'Manager', 'Server-wide', ['A', 'B', 'C'], true),
  createData(3, 'Employee', 'Server-wide', ['A', 'B', 'C'], true),
  createData(4, 'Guest', 'Server-wide', ['A', 'B', 'C'], true),
];

function StoreRoles() {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Role</TableCell>
            <TableCell>Scope</TableCell>
            <TableCell>Permissions</TableCell>
            <TableCell>In use</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row">
                {row.role}
              </TableCell>
              <TableCell>{row.scope}</TableCell>
              <TableCell>{row.permissions}</TableCell>
              <TableCell>{row.inUse} YES OR NO</TableCell>
              <TableCell align="right">
                <Button>A</Button>
                <Button>B</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
