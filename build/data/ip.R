library(tidyverse)
library(jsonlite)

#From Chad:
#All the data will be uploaded here: 
dir_data <- "https://app.box.com/v/BMPPOpptyInd-Interactive"

#downloadable data for each metro area here: 
dir_download <- "https://app.box.com/v/BMPPOI-MetroJobShares"

#vars in flow data
#occ_a - SOC of starting occ
#titlea - Title of starting occ
#occ_b - SOC of ending occ
#titleb - Title of ending occ

#p_h_wage - Hourly wage in starting occ
#p_a_wage - Annual wage in starting occ
#f_h_wage – Hourly wage in ending occ
#f_a_wage – Annual wage in ending occ

#probs - Share of employed in starting occ that end up in ending occ
#opportunity - Share of employed in starting occ that will hold a good job when they reach the ending occ
#other – Share of employed in starting occ that do not have and will not have a good job at start or end of pathway
#weight – Raw person weight (number of employed in that starting occ meeting personal descriptors as implied by ACS data) – ignore this

occs <- read_csv("/home/alec/Projects/Brookings/opportunity-industries/build/data/metro_job_quality/met_opptyocc2017j.csv") %>% 
        filter(level==3) %>% mutate(occ=substr(sub("-","",soc_code), 1, 3))

occs2 <- occs %>% group_by(cbsa_code, CBSA_Title) %>% mutate(shtot=total/sum(total))

#msp specific data file -- rough, need to rework code with final data
mspflow <- read_csv("/home/alec/Projects/Brookings/opportunity-industries/build/data/flat_files/33460 Minneapolis MN-WI 3digit flows.csv")

mspflow2 <- mspflow %>% filter(gender=="Total", age=="Total", race=="Total", education=="Total")

wage_levels_a <- mspflow2 %>% group_by(occ_a, titlea) %>% summarise(swage=mean(p_a_wage)) %>% mutate(occ=sub("a","", occ_a))
wage_levels_b <- mspflow2 %>% group_by(occ_b, titleb) %>% summarise(ewage=mean(f_a_wage)) %>% mutate(occ=sub("b","", occ_b))

wage_levels <- full_join(wage_levels_a, wage_levels_b) %>% ungroup() %>% select(occ, title=titlea, swage, ewage)

mspoccs <- occs2 %>% filter(cbsa_code==33460) %>% ungroup() %>% 
                     select("occ", "occupation", "shtot", "total", "good_share","promising_share",
                            "hi_good_share", "hi_promising_share", "other_share", "undefined")


msp_summary <- full_join(mspoccs, wage_levels)
mspflow3 <- mspflow2 %>% select(occ_a, occ_b, opportunity, other)

json <- toJSON(list(summary=msp_summary, flows=mspflow3), na="null", digits=5, pretty=TRUE)
writeLines(json, con="/home/alec/Projects/Brookings/opportunity-industries/data/msp.json")

##old


#to json
#data questions: any differences b/n occa/titlea and b?
#redo so that start occs is a single array of data -- avoid repeating wage data 95 times for each occ -- not sure if kosher
dict <- mspflow %>% select(occ_a, titlea) %>% 
          as.data.frame %>% unique() %>% 
          filter(!duplicated(occ_a)) %>% 
          spread(occ_a, titlea)

dat <- mspflow2 %>% select(occ_a, occ_b, sw=p_a_wage, ew=f_a_wage, opp=opportunity, oth=other) %>% as.data.frame() %>% split(.$occ_a)

sum_probs <- mspflow2 %>% group_by(occ_a, titlea) %>% summarise(share=sum(probs), min=min(p_a_wage), max=max(p_a_wage)) %>% mutate(diff=max-min)

json <- toJSON(dat, na="null", digits=5, pretty=TRUE)

writeLines(json, con="/home/alec/Projects/Brookings/opportunity-industries/data/msp.json")

writeLines(c("var start_occs = ", toJSON(dict, pretty=TRUE), ";", "export default start_occs;",""), 
           con="/home/alec/Projects/Brookings/opportunity-industries/build/js/start-occs.js")
