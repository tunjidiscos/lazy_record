import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSnackPresistStore } from 'lib/store/snack';
import { useStorePresistStore, useUserPresistStore, useWalletPresistStore } from 'lib/store';
import axios from 'utils/http/axios';
import { Http } from 'utils/http/http';
import { RandomWords, AddAndShuffleArray, GetUniqueRandomIndices } from 'utils/strings';

type SelectMems = {
  index: number;
  selectArrays: string[];
  value: string;
};

const PhraseBackupConfirm = () => {
  const { setSnackOpen, setSnackMessage, setSnackSeverity } = useSnackPresistStore((state) => state);
  const { getIsWallet, getWalletId } = useWalletPresistStore((state) => state);
  const { getUserId } = useUserPresistStore((state) => state);
  const { getIsStore, getStoreId } = useStorePresistStore((state) => state);

  const [selectMems, setSelectMems] = useState<SelectMems[]>([]);
  const [phrase, setPhrase] = useState<string[]>([]);
  const [selectWord, setSelectWord] = useState<Record<number, string>>({});

  const updateWalletBackup = async () => {
    try {
      const response: any = await axios.put(Http.update_backup_by_wallet_id, {
        wallet_id: getWalletId(),
      });
      if (response.result) {
        setSnackSeverity('success');
        setSnackMessage('Mnemonic phrase confirm success');
        setSnackOpen(true);

        setTimeout(async () => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    } catch (e) {
      setSnackSeverity('error');
      setSnackMessage('The network error occurred. Please try again later.');
      setSnackOpen(true);
      console.error(e);
    }
  };

  const fetchWalletData = async () => {
    try {
      if (getIsWallet()) {
        const response: any = await axios.get(Http.find_wallet_by_id, {
          params: {
            id: getWalletId(),
          },
        });

        if (response.result) {
          const phraseArray = response.data.mnemonic.split(' ');
          setPhrase(phraseArray);

          const randomIndices = GetUniqueRandomIndices(phraseArray.length, 3).map((index) => index + 1);

          const createMem = (index: number) => ({
            index,
            selectArrays: AddAndShuffleArray(RandomWords(2), phraseArray[index - 1]),
            value: phraseArray[index - 1],
          });

          setSelectMems(randomIndices.map(createMem).sort((a, b) => a.index - b.index));
        } else {
          setSnackSeverity('error');
          setSnackMessage("Cannot find the wallet, please try again later.");
          setSnackOpen(true);
        }
      }
    } catch (e) {
      setSnackSeverity('error');
      setSnackMessage('The network error occurred. Please try again later.');
      setSnackOpen(true);
      console.error(e);
    }
  };

  useEffect(() => {
    if (!getIsStore()) {
      window.location.href = '/stores/create';
    }
    fetchWalletData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleButtonClick = (index: number, selectItem: string) => {
    setSelectWord((prevSelectWord) => ({
      ...prevSelectWord,
      [index]: selectItem,
    }));
  };

  const onClickSelectWord = async (selectWord: Record<number, string>) => {
    if (Object.keys(selectWord).length === 3) {
      let matchTime = 0;
      Object.keys(selectWord).forEach((key) => {
        if (phrase[parseInt(key) - 1] === selectWord[parseInt(key)]) {
          matchTime += 1;
        }
      });

      if (matchTime === 3) {
        await updateWalletBackup();
      } else {
        setSelectWord({});

        setSnackSeverity('warning');
        setSnackMessage('Matching errors, please try again');
        setSnackOpen(true);
      }
    }
  };

  useEffect(() => {
    onClickSelectWord(selectWord);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectWord]);

  return (
    <Box>
      <Container>
        <Stack mt={20}>
          <Typography variant="h4">Confirm your mnemonic phrase again</Typography>
          <Typography mt={5}>Please select your mnemonic phrase in order</Typography>
          <Box mt={5} width={500}>
            <Card variant="outlined">
              <CardContent>
                {selectMems.map((item) => (
                  <Box key={item.index} pb={4}>
                    <Stack direction={'row'} alignItems={'center'}>
                      <Typography fontWeight={'bold'}>Mnemonic phrase</Typography>
                      <Typography fontWeight={'bold'}># {item.index}</Typography>
                    </Stack>
                    <Stack direction={'row'} alignItems={'center'} mt={2}>
                      {item.selectArrays.map((selectItem, selectIndex) => (
                        <Box key={selectIndex}>
                          <Button
                            style={{
                              minWidth: 100,
                              textTransform: 'none',
                              fontWeight: selectWord[item.index] === selectItem ? 'bold' : 'normal',
                              backgroundColor: selectWord[item.index] === selectItem ? 'powderblue' : '',
                            }}
                            onClick={() => handleButtonClick(item.index, selectItem)}
                          >
                            {selectItem}
                          </Button>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default PhraseBackupConfirm;
